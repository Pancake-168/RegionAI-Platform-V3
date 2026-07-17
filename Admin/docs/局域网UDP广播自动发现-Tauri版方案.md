# Tauri 局域网 TCP 指纹扫描 + NocoBase 登录页方案

## 一、背景

目标项目 `RegionAI-Patform-V3\RegionAIv3` 是一个 Tauri v2 + Vite + Vue3 桌面应用（暗色优先，Reka UI + CSS Token + `@iconify/vue` + `@nocobase/sdk`）。需要在此框架下复现之前 YanJing-Matrix-Platform 项目中的局域网 IP 搜查 + NocoBase 登录功能。

当前项目登录页 `src/views/views/LoginPage/index.vue` 是空模板，路由仅有 `/`（DemoPage）和 `/admin`（AdminPage），无 `/login` 路由。

## 二、任务清单

| #   | 任务                                                                                                       | 涉及层 |
| --- | ---------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Rust 侧实现 TCP 指纹扫描（`discover_server` command）                                                      | Rust   |
| 2   | 新增 `reqwest`、`tokio`、`regex`、`get_if_addrs` 到 Cargo.toml                                             | Rust   |
| 3   | 编写 LoginPage 登录页 UI（登录卡片 + 状态提示 + 齿轮开关 + 用户名密码）                                    | Vue3   |
| 4   | 编写 LoginPage `<style scoped>` 样式                                                                       | Vue3   |
| 5   | 编写 `useServerDiscovery` composable                                                                       | Vue3   |
| 6   | 注册 `/login` 路由                                                                                         | Vue3   |
| 7   | 删除 `NOCOBASE_SERVER_OPTIONS` 中硬编码的 `https://db.zheshu.tech/api`                                     | Vue3   |
| 8   | NocoBase 登录调 `loginByAccount` → `nocoBaseService.createClient` → `NocoBaseAuth.setAuth` → 跳转 `/admin` | Vue3   |

## 三、Rust 侧：TCP 指纹扫描

### 3.1 新增 Cargo 依赖

```toml
# Cargo.toml 新增
reqwest = { version = "0.12", features = ["json"] }
tokio = { version = "1", features = ["rt", "sync"] }
regex = "1"
```

`reqwest` 发送 HTTP 请求（内置 `tokio` 运行时）、`regex` 做指纹正则匹配、`get_if_addrs` 遍历本机所有网卡并读取真实 netmask 以计算子网范围。`serde` / `serde_json` 已在项目中无需添加。`serde` / `serde_json` 已在项目中，无需额外添加。

### 3.2 新建 `src-tauri/src/discover.rs`

独立文件，不污染 `lib.rs`。`lib.rs` 中 `mod discover;` 并在 `generate_handler![]` 中注册。

#### 对外接口

```rust
#[tauri::command]
async fn discover_server() -> Result<Vec<DiscoveredServer>, String> { ... }
```

#### 返回类型

```rust
#[derive(Debug, Clone, serde::Serialize)]
struct DiscoveredServer {
    ip: String,      // 如 "192.168.10.11"
    api_port: String, // API 端口，从指纹提取
    db_port: String,  // NocoBase 端口，来自 identify
    im_port: String,  // Matrix 端口，来自 identify
}
```

#### 实现步骤

1. **获取子网列表**：读取本机所有 IPv4 私网接口的 IP 和子网掩码，逐接口计算网络地址和广播地址，得到 IP 数量。仅扫描 10.0.0.0/8、172.16.0.0/12、192.168.0.0/16 内的接口。
2. **并发 TCP 指纹扫描**：对子网内每个 IP 发送 `GET http://{ip}/`，超时 800ms。用 `Arc<Semaphore>` 限制并发 ≤ 30。用正则 `/regionai platform API on :(\d+)/` 匹配响应体。
3. **匹配后调 identify**：指纹匹配成功 → 用指纹提取的 `api_port` 构造 `http://{ip}:{api_port}/regionai/identify`，向**该 IP 的 API 端口**发起请求，而非默认的 80 端口。解析响应 `{"db":"...","im":"..."}` JSON。
4. **返回结果**：跨子网扫描，第一个子网扫到结果立即返回，不再扫描后续子网。

#### 并发控制

`reqwest` 本身就是 `async`，配合 `tokio::sync::Semaphore` 做令牌桶限流。每轮起 N 个 `tokio::spawn`（N = 子网 IP 数），每个 spawn 先 `acquire` 信号量再发请求，完成后 `drop` 释放。

### 3.3 `lib.rs` 改动

- 添加 `mod discover;`
- `generate_handler![]` 中追加 `discover::discover_server`
- `capabilities/default.json` 无需额外权限（`core:default` 已覆盖）

## 四、前端侧：composable

### 4.1 新建 `src/composables/useServerDiscovery.ts`

```typescript
// 导出类型供 LoginPage 使用
export interface DiscoveredServer {
  ip: string
  apiPort: string
  dbPort: string
  imPort: string
}
```

**核心逻辑**：

```typescript
export function useServerDiscovery() {
  const isDiscovering = ref(false) // 是否正在扫描
  const discoveredServer = ref<DiscoveredServer | null>(null) // 扫描结果
  const scanRound = ref(0) // 第几轮
  let stopped = false // 是否已终止
  let timer: ReturnType<typeof setTimeout> | null = null

  const isElectron = isTauri() // 运行时检测

  const displayLabel = computed(() => {
    // UI 展示用
    if (!discoveredServer.value) return ''
    return discoveredServer.value.ip
  })

  async function scanOnce(): Promise<boolean> {
    // invoke('discover_server') 调用 Rust 侧扫描
    const servers = await invoke<DiscoveredServer[]>('discover_server')
    const first = servers[0]
    if (first && !stopped) {
      discoveredServer.value = first
      return true
    }
    return false
  }

  async function startScan() {
    if (!isElectron || stopped) return
    isDiscovering.value = true
    while (!stopped) {
      scanRound.value++
      const found = await scanOnce()
      if (found) {
        isDiscovering.value = false
        return
      }
      await new Promise<void>((r) => {
        timer = setTimeout(r, 2000)
      })
    }
  }

  function stop() {
    stopped = true
    if (timer) clearTimeout(timer)
  }
  onBeforeUnmount(stop)

  return { isDiscovering, discoveredServer, displayLabel, scanRound, startScan }
}
```

与 YanJing-Matrix-Platform 版的差异：

- `window.electronAPI.discoverServer()` → `invoke<DiscoveredServer[]>('discover_server')`
- `isTauri()` 替代 `!!window.electronAPI`
- 不再依赖 `useServerConfig` store（该项目无此 store，地址直接存 `NocoBaseAuth` store）

## 五、前端侧：NocoBase URL 去硬编码

### 5.1 `services/NocoBase/url.ts` — 删除硬编码

删除整个 `NOCOBASE_SERVER_OPTIONS` 常量（第 17-28 行）。该变量的唯一用途是给登录页面提供下拉选项，但新方案中地址来自扫描结果或用户手动输入，不再需要预定义的选项列表。

### 5.2 `services/NocoBase/url.ts` — 删除内网 IP

删除 `getNocoBaseHosts()` 函数中的硬编码内网 IP（`127.0.0.1:13000`、`localhost:13000`），host 列表仅保留从 `getCleanNocoBase()` 解析出的实际 host。

### 5.3 `apiUrls.ts` — BASE_URL 保持 todo

`apiUrls.ts` 中的 `BASE_URL = ''` 保持不变。本项目登录通过 NocoBase SDK 直连，不经过 SSO 体系，`BASE_URL` 相关的 API_URLS 方法（Login、Register、SendCode 等）在局域网场景下不会被调用。

## 六、登录页面 UI 设计

### 6.1 页面结构

登录页为居中布局的单卡片页面。**不写外层容器**（App.vue 已提供 `.app-layout` > `.main-page` > `.app-content` > `<router-view />`）。

```
┌─────────────────────────────────────────┐
│                                         │
│    ┌───────────────────┐                │
│    │                   │                │
│    │   ⏳ 正在扫描...    │  ← 状态卡片   │
│    │       (第3轮)      │                │
│    │                   │                │
│    │   [三个输入框]     │  ← 默认隐藏    │
│    │   v-show=false     │    齿轮展开可见 │
│    │                   │                │
│    │   账号 [________]  │                │
│    │   密码 [________]  │                │
│    │   [登录]           │                │
│    │                   │           ⚙    │ ← 齿轮
│    └───────────────────┘                │
│                                         │
└─────────────────────────────────────────┘
```

### 6.2 编码规范（严格对照 `docs/新页面编写规范.md` 最新版）

- 所有颜色引用 `var(--xxx)`，不写死
- **模板内禁止 `:style=""` 属性**，全部改为 `<style scoped>` 中定义 class 后 `class="xxx"` 引用
- 页面私有样式写在 `.vue` 文件内的 `<style scoped>` 块，不使用 `*.module.css`
- 图标用 `@iconify/vue`（`codicon:` 或 `material-symbols:`）
- 日志用 `createLogger('LoginPage.vue', '函数名')`，只用 `info` / `warn` / `error`
- 无 CSS 框架、无 Tailwind
- 无额外字体文件

### 6.3 注释规范

**每一行代码都需要行级注释**，不是函数体外的大段注释。风格如下：

```typescript
// 从 composable 获取扫描状态
const { isDiscovering, discoveredServer, displayLabel, scanRound, startScan } =
  useServerDiscovery()
// 齿轮开关状态：true 表示用户展开手动配置面板
const showManualConfig = ref(false)
// 三个服务器地址的输入绑定值
const apiBaseUrl = ref('') // 对应 http://{ip}:{apiPort}，填入 VITE_API_BASE 场景
const matrixUrl = ref('') // 对应 http://{ip}:{imPort}，填入 Matrix 服务器地址
const nocobaseUrl = ref('') // 对应 http://{ip}:{dbPort}，填入 NocoBase 服务器地址
```

Rust 侧同样，每行双斜杠注释：

```rust
// 遍历每个接口的地址列表
for addr in addrs {
    // 只处理 IPv4 且非回环地址
    if addr.kind() != IpAddrKind::V4 || addr.is_loopback() {
        continue; // 跳过 IPv6 和 127.0.0.1
    }
```

### 6.4 设计 Token

登录卡片所有视觉属性直接复用现有 Token，**不需要在 `variables.css` 中新增任何 Token**。以下为登录页各元素与现有 Token 的映射关系：

| 元素          | 使用的现有 Token       | 说明                                                |
| ------------- | ---------------------- | --------------------------------------------------- |
| 卡片背景      | `var(--bg-elev)`       | 暗色 #11141a / 亮色 #ffffff                         |
| 卡片边框      | `var(--border)`        | 暗色 rgba(255,255,255,0.08) / 亮色 rgba(0,0,0,0.08) |
| 卡片圆角      | `var(--radius-xl)`     | 12px                                                |
| 卡片阴影      | `var(--shadow-md)`     | 暗色深阴影 / 亮色浅阴影                             |
| 齿轮默认色    | `var(--muted)`         | 暗色 #9aa3b2 / 亮色 #5a6678                         |
| 齿轮 hover 色 | `var(--accent)`        | 暗色 #e2b04a / 亮色 #c78c2e                         |
| 扫描中指示色  | `var(--color-system)`  | 暗色 #82aaff / 亮色 #4076f5                         |
| 扫描完成色    | `var(--color-success)` | 亮暗一致 #2fcb5b                                    |
| 错误提示色    | `var(--color-error)`   | 暗色 #f07178 / 亮色 #d94f56                         |
| 输入框        | `Input` 组件           | §3 组件，自带统一样式，无需额外 Token               |

### 6.5 模板结构

**不写 `:style`，全部用 `<style scoped>` 中的 class**。`form-group`、`field-error`、`login-error`、`login-btn`、`gear-btn`、`manual-config`、`discover-status` 等 class 均在 `<style scoped>` 块中定义，颜色/圆角/阴影全部引用 `var(--xxx)`。输入框和登录按钮复用 `<Input>` / `<Button>` 组件，无需自定义 class。

```vue
<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 区域 1：扫描状态（仅 Tauri 桌面端） -->
      <div v-if="isTauriRuntime" class="discover-status">
        <template v-if="isDiscovering">
          <span class="discover-status-icon discover-status-icon--scanning" />
          <span class="discover-status-text">正在扫描局域网...</span>
          <span class="discover-status-round">(第 {{ scanRound }} 轮)</span>
        </template>
        <template v-else-if="displayLabel">
          <span class="discover-status-icon discover-status-icon--done" />
          <span class="discover-status-text">服务已就绪</span>
        </template>
        <template v-else>
          <span class="discover-status-icon discover-status-icon--scanning" />
          <span class="discover-status-text">正在扫描局域网...</span>
        </template>
      </div>

      <!-- 区域 2：三个 URL 输入框（默认隐藏，齿轮展开可见） -->
      <div v-show="showManualConfig" class="manual-config">
        <div class="form-group">
          <Input
            v-model="apiBaseUrl"
            placeholder="API 地址 (http://x.x.x.x:端口)"
            @blur="validateAndPersist('api')"
          />
          <span v-if="apiBaseError" class="field-error">{{
            apiBaseError
          }}</span>
        </div>
        <div class="form-group">
          <Input
            v-model="matrixUrl"
            placeholder="IM 地址 (http://x.x.x.x:端口)"
            @blur="validateAndPersist('matrix')"
          />
          <span v-if="matrixUrlError" class="field-error">{{
            matrixUrlError
          }}</span>
        </div>
        <div class="form-group">
          <Input
            v-model="nocobaseUrl"
            placeholder="DB 地址 (http://x.x.x.x:端口)"
            @blur="validateAndPersist('nocobase')"
          />
          <span v-if="nocobaseUrlError" class="field-error">{{
            nocobaseUrlError
          }}</span>
        </div>
      </div>

      <!-- 区域 3：账号密码 -->
      <div class="form-group">
        <Input v-model="username" placeholder="请输入账号" />
      </div>
      <div class="form-group">
        <Input
          v-model="password"
          type="password"
          placeholder="请输入密码"
          @keyup.enter="handleLogin"
        />
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="login-error">{{ errorMessage }}</div>

      <!-- 登录按钮 -->
      <Button
        variant="primary"
        class="login-btn"
        :disabled="!canLogin"
        :loading="isLoggingIn"
        @click="handleLogin"
      >
        登录
      </Button>
    </div>

    <!-- 齿轮（右下角，仅 Tauri 桌面端） -->
    <Button
      v-if="isTauriRuntime"
      variant="subtle"
      class="gear-btn"
      :class="{ 'gear-btn--active': showManualConfig }"
      @click="toggleManualConfig"
    >
      <template #icon>
        <Icon icon="codicon:settings-gear" :width="18" />
      </template>
    </Button>
  </div>
</template>
```

### 6.6 脚本核心逻辑

```typescript
import { isTauri } from '@/utils/isTauri' // Tauri 运行时检测函数
import { Input, Button } from '@/components/common' // 项目通用组件：输入框、按钮
import { Icon } from '@iconify/vue' // 图标组件（codicon:settings-gear）

// Tauri 运行时标记：模板中 v-if 使用，避免直接调函数导致响应式问题
const isTauriRuntime = isTauri()

// 齿轮开关状态：true 表示用户展开手动配置面板
const showManualConfig = ref(false)
// 三个服务器地址的输入绑定，来自扫描结果或用户手动填入
const apiBaseUrl = ref('') // http://{ip}:{apiPort}，对应 API 后端
const matrixUrl = ref('') // http://{ip}:{imPort}，对应 IM/Matrix
const nocobaseUrl = ref('') // http://{ip}:{dbPort}，对应 NocoBase
// 登录凭据
const username = ref('') // NocoBase 账号
const password = ref('') // 密码
const errorMessage = ref('') // 错误提示
const isLoggingIn = ref(false) // 登录中

// composable
const { isDiscovering, discoveredServer, displayLabel, scanRound, startScan } =
  useServerDiscovery()

// computed
const canLogin = computed(
  () =>
    nocobaseUrl.value.trim() !== '' &&
    username.value.trim() !== '' &&
    password.value.trim() !== '',
)

// 双 watch：discoveredServer + showManualConfig，与 YanJing-Matrix-Platform 逻辑一致
watch(discoveredServer, (srv) => {
  if (srv && !showManualConfig.value) applyServer(srv)
})
watch(showManualConfig, (nowOpen) => {
  if (!nowOpen && discoveredServer.value && !hasManualInput())
    applyServer(discoveredServer.value)
})

// onMounted
onMounted(() => {
  startScan() // 自动启动扫描
})
```

### 6.7 登录流程

```
用户点击登录
  → nocobaseUrl 以 http://{ip}:{dbPort}/api 格式拼接
  → loginByAccount(nocobaseUrl, username, password)
    → 成功返回 APIClient（内部已调用 nocoBaseService.createClient，AuthenticatedClient 已设好）
  → 从返回的 client 提取 token → authStore.setAuth(token, baseURL)  // 写入 Pinia store
  → router.push('/admin')                                                // 跳转后台管理页
```

`loginByAccount` 内部调用了 `nocoBaseService.createClient(token, finalUrl)`，该方法已设置 `this.AuthenticatedClient`（client.ts:47）并缓存 `this.AuthedBaseURL`（client.ts:51），无需再调 `setAuthedClient`。登录页只负责从返回的 `APIClient` 实例中提取 token、写入 `NocoBaseAuth` store 供后续 API 调用使用。

## 七、路由注册

`src/router/index.ts` 新增：

```typescript
{
  path: '/login',
  name: 'Login',
  component: () => import('@/views/views/LoginPage/index.vue'),
}
```

同时将根路由 `/` 从直接指向 DemoPage 改为加路由守卫：Tauri 桌面端首次启动直接显示 `/login`，非 Tauri（浏览器开发）保持 `/` 走 DemoPage。

守卫逻辑：

```typescript
router.beforeEach((to) => {
  if (to.path === '/' && isTauri()) return '/login'
})
```

## 八、涉及文件清单

| 文件                                    | 操作     | 说明                                                                  |
| --------------------------------------- | -------- | --------------------------------------------------------------------- |
| `src-tauri/Cargo.toml`                  | 修改     | 新增 `reqwest`、`tokio`、`regex`、`get_if_addrs` 依赖                 |
| `src-tauri/src/discover.rs`             | **新建** | TCP 指纹扫描完整实现                                                  |
| `src-tauri/src/lib.rs`                  | 修改     | `mod discover` + `generate_handler` 注册                              |
| `src/composables/useServerDiscovery.ts` | **新建** | 扫描 composable（`invoke` 调 Rust）                                   |
| `src/views/views/LoginPage/index.vue`   | **重写** | 完整登录页 UI + 逻辑 + `<style scoped>` 私有样式                      |
| `src/router/index.ts`                   | 修改     | 注册 `/login` 路由 + 根路由守卫                                       |
| `src/services/NocoBase/url.ts`          | 修改     | 删除 `NOCOBASE_SERVER_OPTIONS`、删除 `getNocoBaseHosts()` 中硬编码 IP |
| `src/styles/variables.css`              | 不改     | 现有 Token 已够用，无需新增                                           |

## 九、日志规范

每个函数级 `createLogger()`，全部 `log.info` / `log.warn` / `log.error`，不使用 `log.debug`。

日志点清单：

| 文件                    | 函数                 | 日志                                                                             |
| ----------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `discover.rs`           | `discover_server`    | info: 子网列表、扫描开始/结束、扫描耗时、发现结果；warn: 空接口；error: 所有异常 |
| `discover.rs`           | `scan_slash_24`      | info: 每轮扫描开始                                                               |
| `useServerDiscovery.ts` | `scanOnce`           | info: 扫描轮次、耗时、结果数、发现服务器；error: invoke 异常                     |
| `useServerDiscovery.ts` | `startScan`          | info: 启动/停止                                                                  |
| `LoginPage/index.vue`   | `handleLogin`        | info: 登录开始、成功、跳转；warn: 参数不完整、token 缺失；error: 登录失败        |
| `LoginPage/index.vue`   | `applyServer`        | info: 搜索结果已填入                                                             |
| `LoginPage/index.vue`   | `toggleManualConfig` | info: 齿轮切换                                                                   |

## 十、不涉及

- `services/NocoBase/data/info.ts` — 不改（登录成功后的数据探测逻辑不变）
- `services/NocoBase/data/embed.ts` — 不改
- `stores/IDmap.ts` — 不改
- `apiUrls.ts` — `BASE_URL` 保持 `''` todo，SSO API 保持不动
- `DemoPage.vue` — 不改
- `AdminPage/*` — 不改
- `TauriBar.vue` — 不改
- `main.ts` / `App.vue` — 不改（logger 初始化、路由挂载均已就位）
