<template>
  <!-- 登录页外层容器：居中全屏布局 -->
  <div class="login-page">
    <!-- 登录卡片：毛玻璃面板 -->
    <div class="login-card">
      <!-- 标题 -->
      <h1 class="login-title">RegionAI管理后台</h1>

      <!-- 区域 1：扫描状态（仅 Tauri 桌面端展示） -->
      <div v-if="isTauriRuntime" class="discover-status">
        <!-- 子状态 A：扫描进行中 — 旋转动画圆点 + 文字 + 轮次 -->
        <template v-if="isDiscovering">
          <span class="discover-status-icon discover-status-icon--scanning" />
          <span class="discover-status-text">正在扫描局域网...</span>
          <span class="discover-status-round">(第 {{ scanRound }} 轮)</span>
        </template>
        <!-- 子状态 B：扫描完成 — 绿色圆点 + 已就绪文字 -->
        <template v-else-if="displayLabel">
          <span class="discover-status-icon discover-status-icon--done" />
          <span class="discover-status-text">服务已就绪</span>
        </template>
        <!-- 子状态 C：首轮未完成但尚未有结果 — 等同于扫描中 -->
        <template v-else>
          <span class="discover-status-icon discover-status-icon--scanning" />
          <span class="discover-status-text">正在扫描局域网...</span>
        </template>
      </div>

      <!-- 区域 2：API 服务器地址输入框（v-show 控制可见性，齿轮开关） -->
      <div v-show="showManualConfig" class="manual-config">
        <!-- API 后端地址 -->
        <div class="form-group">
          <Input
            v-model="apiBaseUrl"
            placeholder="API 地址 (http://x.x.x.x:端口)"
            :error="apiBaseError"
            @blur="handleApiBlur()"
          />
        </div>
      </div>

      <!-- 区域 3：NocoBase 账号 -->
      <div class="form-group">
        <Input v-model="username" placeholder="请输入账号" />
      </div>
      <!-- NocoBase 密码 -->
      <div class="form-group">
        <Input
          v-model="password"
          type="password"
          placeholder="请输入密码"
          @keyup.enter="handleLogin"
        />
      </div>

      <!-- 错误提示：红色背景文字 -->
      <div v-if="errorMessage" class="login-error">{{ errorMessage }}</div>

      <!-- 登录按钮：项目通用 Button 组件，支持 loading 态 -->
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

    <!-- 齿轮开关（右下角，仅 Tauri 桌面端） -->
    <Button
      v-if="isTauriRuntime"
      variant="subtle"
      class="gear-btn"
      :class="{ 'gear-btn--active': showManualConfig }"
      @click="toggleManualConfig"
    >
      <template #icon>
        <IconContainer :size="18" shape="rounded">
          <Icon :icon="getIcon('settingsGear')" :width="18" />
        </IconContainer>
      </template>
    </Button>
  </div>
</template>

<script setup lang="ts">
// ===== 框架和工具导入 =====
import { ref, computed, watch, onMounted } from 'vue' // Vue 核心：ref 响应式、computed 派生、watch 监听、onMounted 生命周期
import { useRouter } from 'vue-router' // Vue Router：登录成功后跳转
import { invoke } from '@tauri-apps/api/core' // Tauri IPC
import { Icon } from '@iconify/vue' // 图标组件：齿轮 SVG（codicon 图标集）
import { Input, Button, IconContainer } from '@/components/common' // 项目通用组件：§3 Input 输入框、§1 Button 按钮
import { createLogger } from '@/utils/logger' // 日志系统：按文件名+函数名创建 logger
import { isTauri } from '@/utils/isTauri' // Tauri 运行时检测
import { useServerDiscovery } from '@/composables/useServerDiscovery' // 局域网扫描 composable
import type { DiscoveredServer } from '@/composables/useServerDiscovery' // 扫描结果类型
import { loginByAccount } from '@/services/NocoBase/url' // NocoBase SDK 账号密码登录
import { useNocoBaseAuthStore } from '@/stores/NocoBaseAuth' // NocoBase 认证状态 store
import { SystemStorageManager } from '@/utils/SystemStorage' // 持久化：保存和恢复服务器地址
import { getIcon } from '@/icons'

/// 校验 URL 格式是否合法（必须以 http:// 或 https:// 开头）
function validateUrl(value: string): boolean {
  try {
    const u = new URL(value) // 尝试解析为 URL
    return u.protocol === 'http:' || u.protocol === 'https:' // 仅允许 HTTP(S)
  } catch {
    return false // 解析失败 → 非法
  }
}

// ===== Logger =====
const loginLog = createLogger('LoginPage.vue', 'handleLogin') // 登录流程日志
const applyLog = createLogger('LoginPage.vue', 'applyServer') // 搜索结果应用日志
const gearLog = createLogger('LoginPage.vue', 'toggleManualConfig') // 齿轮开关日志

// ===== Router =====
const router = useRouter() // 登录成功后跳转用，必须在 setup 顶层调用

// ===== 运行时和环境 =====
const isTauriRuntime = isTauri() // Tauri 桌面端标记：控制扫描状态和齿轮是否展示

// ===== 扫描 composable =====
// 非 Tauri 环境提供假的空状态，避免类型错误
const { isDiscovering, discoveredServer, displayLabel, scanRound, startScan } =
  isTauriRuntime
    ? useServerDiscovery() // Tauri 环境：启动真正的扫描
    : {
        // 浏览器 dev 环境：假状态，不触发扫描
        isDiscovering: ref(false),
        discoveredServer: ref(null),
        displayLabel: ref(''),
        scanRound: ref(0),
        startScan: async () => {},
      }

// ===== 齿轮开关 =====
const showManualConfig = ref(false) // false = 输入框隐藏，仅看扫描状态；true = 展开 API 地址输入框
const hasPinnedTarget = ref(false) // 是否已记录用户登录过的目标地址
const hasClosedManualConfig = ref(false) // 用户关闭齿轮后，禁止扫描结果再覆盖

/// 切换手动配置面板的展开/收折
function toggleManualConfig() {
  showManualConfig.value = !showManualConfig.value // 取反切换
  gearLog.info(
    showManualConfig.value
      ? '齿轮展开，显示手动配置面板'
      : '齿轮关闭，隐藏手动配置面板',
  )
}

// ===== 服务器地址输入 =====
const apiBaseUrl = ref('') // API 后端地址：http://{ip}:{apiPort}
const matrixUrl = ref('') // IM/Matrix 地址：http://{ip}:{imPort}
const nocobaseUrl = ref('') // NocoBase/DB 地址：http://{ip}:{dbPort}
const apiBaseError = ref('') // API 地址校验错误文本

// ===== 登录凭据 =====
const username = ref('') // NocoBase 账号
const password = ref('') // NocoBase 密码
const errorMessage = ref('') // 登录错误提示
const isLoggingIn = ref(false) // 登录中标记：控制按钮 loading 和禁用

// ===== computed =====

/// 登录按钮是否可点击：API 地址推导出的 Matrix/NocoBase 地址 + 账号 + 密码缺一不可
const canLogin = computed(() => {
  return (
    apiBaseUrl.value.trim() !== '' &&
    matrixUrl.value.trim() !== '' &&
    nocobaseUrl.value.trim() !== '' &&
    username.value.trim() !== '' &&
    password.value.trim() !== ''
  )
})

// ===== 服务器地址持久化 =====

/// 根据 API 地址调用 identify 推导 Matrix/NocoBase 地址
async function deriveServerUrls(): Promise<boolean> {
  if (!isTauriRuntime || !validateUrl(apiBaseUrl.value)) return false
  try {
    const data = await invoke<{ db?: string; im?: string }>('identify_server', {
      apiUrl: apiBaseUrl.value,
    })
    if (data?.db && data?.im) {
      const origin = new URL(apiBaseUrl.value).origin.replace(/:\d+$/, '')
      nocobaseUrl.value = `${origin}:${data.db}`
      matrixUrl.value = `${origin}:${data.im}`
      return true
    }
  } catch (e) {
    console.warn('[LoginPage] identify 失败', e)
  }
  return false
}

/// API 地址失焦处理：校验、推导并持久化
async function handleApiBlur() {
  if (!validateUrl(apiBaseUrl.value)) {
    apiBaseError.value = '请输入有效的服务器地址（需包含 http://）'
    return
  }
  const ok = await deriveServerUrls()
  if (!ok) {
    apiBaseError.value =
      '无法从 API 地址推导出 Matrix/NocoBase 地址，请检查 API 地址'
    return
  }
  apiBaseError.value = ''
  await persistServerUrls()
}

/// 将三个地址写入 localStorage 持久化（键名与 Electron 版 SystemStorage 一致）
async function persistServerUrls() {
  // 三个都通过 URL 格式校验才写入
  if (
    validateUrl(apiBaseUrl.value) &&
    validateUrl(matrixUrl.value) &&
    validateUrl(nocobaseUrl.value)
  ) {
    // 并行写入三个 key
    await Promise.all([
      SystemStorageManager.setServerApiBaseUrl(apiBaseUrl.value), // API 后端地址
      SystemStorageManager.setServerMatrixUrl(matrixUrl.value), // IM/Matrix 地址
      SystemStorageManager.setServerNocobaseUrl(nocobaseUrl.value), // NocoBase 地址
    ])
    applyLog.info('服务器地址已持久化', { api: apiBaseUrl.value })
  }
}

// ===== 竞态保护：双 watch =====

/// 将扫描到的服务器地址填入三个输入框
function applyServer(server: DiscoveredServer) {
  apiBaseUrl.value = `http://${server.ip}:${server.apiPort}` // API 地址
  matrixUrl.value = `http://${server.ip}:${server.imPort}` // IM 地址
  nocobaseUrl.value = `http://${server.ip}:${server.dbPort}` // DB 地址
  void persistServerUrls() // 异步持久化
  applyLog.info('扫描结果已填入输入框', {
    ip: server.ip,
    apiPort: server.apiPort,
    dbPort: server.dbPort,
    imPort: server.imPort,
  })
}

if (isTauriRuntime) {
  // watch 0：手动输入 API 地址时调 identify 获取后两个端口
  watch(apiBaseUrl, () => {
    if (!showManualConfig.value) return
    void deriveServerUrls()
  })

  // watch 1：discoveredServer 变化 → 齿轮未展开时自动 apply
  watch(discoveredServer, (server) => {
    if (
      server &&
      !showManualConfig.value &&
      !hasPinnedTarget.value &&
      !hasClosedManualConfig.value
    ) {
      applyServer(server) // 直接填入
    }
  })

  // watch 2：齿轮关闭后，禁止扫描结果再覆盖当前地址
  watch(showManualConfig, (nowOpen) => {
    if (!nowOpen) {
      hasClosedManualConfig.value = true
    }
  })
}

// ===== 登录流程 =====

/// 处理登录按钮点击
async function handleLogin() {
  // 防止重复提交
  if (isLoggingIn.value) return
  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = '请输入账号和密码'
    return
  }

  // 登录前再次推导，确保 Matrix/NocoBase 地址与 API 地址一致
  const derivedOk = await deriveServerUrls()
  if (!derivedOk || !matrixUrl.value.trim() || !nocobaseUrl.value.trim()) {
    errorMessage.value =
      '无法从 API 地址推导出 Matrix/NocoBase 地址，请检查 API 地址'
    return
  }
  await persistServerUrls()

  errorMessage.value = '' // 清空之前的错误
  isLoggingIn.value = true // 进入 loading 状态
  // 构造 NocoBase API 地址：DB 地址 + /api 后缀
  const nocobaseApiUrl = nocobaseUrl.value.replace(/\/+$/, '') + '/api' // 去掉末尾斜杠后拼接

  try {
    loginLog.info('开始登录', {
      url: nocobaseApiUrl,
      username: username.value.trim(),
    })
    // 调用 NocoBase SDK 账号密码登录（内部已创建并设置 AuthenticatedClient）
    const client = await loginByAccount(
      nocobaseApiUrl,
      username.value.trim(),
      password.value.trim(),
    )
    if (!client) {
      errorMessage.value = '登录失败：账号或密码错误'
      loginLog.warn('登录失败', { url: nocobaseApiUrl })
      return
    }

    // 从已认证客户端中提取 token
    const token = client.auth.getToken?.() || '' // NocoBase SDK 的 getToken 方法
    if (!token) {
      errorMessage.value = '登录失败：未获取到认证令牌'
      loginLog.warn('登录返回的客户端中无 token')
      return
    }

    // 将认证信息写入 Pinia store（供后续 API 调用使用）
    const authStore = useNocoBaseAuthStore() // 获取 store 实例
    authStore.setAuth(String(token), nocobaseApiUrl) // 存储 token 和 baseURL
    // 记录用户登录过的目标 API 地址，后续优先使用且禁止被扫描覆盖
    await SystemStorageManager.setServerPinnedTarget(apiBaseUrl.value)

    loginLog.info('登录成功，即将跳转', { url: nocobaseApiUrl })

    // 跳转到后台管理页面
    await router.push('/admin') // 导航到 AdminPage
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errorMessage.value = `登录失败：${message}` // 显示错误详情
    loginLog.error('登录异常', error)
  } finally {
    isLoggingIn.value = false // 恢复按钮可用状态
  }
}

// ===== 生命周期 =====

onMounted(async () => {
  // 1. 从 localStorage 恢复上次手动输入的服务器地址
  const savedApi = await SystemStorageManager.getServerApiBaseUrl() // API 地址
  const savedMatrix = await SystemStorageManager.getServerMatrixUrl() // Matrix 地址
  const savedNoco = await SystemStorageManager.getServerNocobaseUrl() // NocoBase 地址
  if (savedApi) apiBaseUrl.value = savedApi // 恢复
  if (savedMatrix) matrixUrl.value = savedMatrix // 恢复
  if (savedNoco) nocobaseUrl.value = savedNoco // 恢复

  // 2. 如果用户登录过一次并记录了目标地址，优先使用该地址，禁止被扫描覆盖
  const pinnedTarget = await SystemStorageManager.getServerPinnedTarget()
  if (pinnedTarget && validateUrl(pinnedTarget)) {
    hasPinnedTarget.value = true
    apiBaseUrl.value = pinnedTarget
    await deriveServerUrls()
    await persistServerUrls()
  }

  // 2. 启动局域网自动扫描（非 Tauri 环境为空函数）
  startScan()
})
</script>

<style scoped>
/* ============================================================================
 * 登录页私有样式 — 全部使用 var(--xxx) Token，不写死颜色/圆角/阴影
 * ============================================================================ */

/* ---- 外层容器：居中布局 ---- */
.login-page {
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  width: 100%; /* 占满父容器宽度 */
  height: 100%; /* 占满父容器高度 */
  position: relative; /* 为齿轮绝对定位提供参考 */
}

/* ---- 登录卡片：毛玻璃深色面板 ---- */
.login-card {
  display: flex; /* Flex 列布局 */
  flex-direction: column; /* 垂直排列子元素 */
  width: 320px; /* 固定宽度 */
  padding: var(--spacing-2xl); /* 24px 内边距 */
  border-radius: var(--radius-xl); /* 12px 圆角 */
  background: var(--bg-elev); /* 暗色 #11141a / 亮色 #ffffff */
  border: 1px solid var(--border); /* 半透明边框 */
  box-shadow: var(--shadow-md); /* 中等阴影 */
  gap: var(--spacing-lg); /* 子元素间距 12px */
}

/* ---- 标题 ---- */
.login-title {
  margin: 0; /* 清除默认 margin */
  font-size: var(--text-md); /* 14px */
  font-weight: 600; /* 加粗 */
  color: var(--text); /* 主文字色 */
  text-align: center; /* 居中 */
}

/* ---- 表单组容器 ---- */
.form-group {
  display: flex; /* Flex 列布局 */
  flex-direction: column; /* label 在上 input 在下 */
  gap: var(--spacing-xs); /* 标签和输入框间距 4px */
}

/* ---- 登录错误提示 ---- */
.login-error {
  padding: var(--spacing-md) var(--spacing-lg); /* 8px 12px 内边距 */
  border-radius: var(--radius-sm); /* 6px 圆角 */
  background: rgba(var(--color-error-rgb), 0.1); /* 淡红色背景 */
  color: var(--color-error); /* 错误红色文字 */
  font-size: var(--text-sm); /* 12px */
  line-height: 1.5; /* 行高 */
}

/* ---- 登录按钮宽度 ---- */
.login-btn {
  width: 100%; /* 撑满卡片宽度 */
}

/* ---- 扫描状态区域 ---- */
.discover-status {
  display: flex; /* 水平排列 */
  align-items: center; /* 垂直居中 */
  gap: var(--spacing-sm); /* 元素间距 6px */
  padding: var(--spacing-md) var(--spacing-lg); /* 8px 12px */
  border-radius: var(--radius-sm); /* 6px 圆角 */
  background: var(--glass); /* 半透明玻璃背景 */
  border: 1px solid var(--glass-brd); /* 玻璃边框 */
}

.discover-status-icon {
  width: 10px; /* 小圆点 10px */
  height: 10px; /* 小圆点 10px */
  border-radius: var(--radius-full); /* 圆形 */
  flex-shrink: 0; /* 不缩放 */
}

/* 扫描中：蓝色旋转动画 */
.discover-status-icon--scanning {
  border: 2px solid var(--color-system); /* 蓝色圆环 */
  border-top-color: transparent; /* 顶部透明 → 弧线视觉 */
  animation: discover-spin 0.8s linear infinite; /* 无限旋转 */
}

/* 扫描完成：绿色实心圆 */
.discover-status-icon--done {
  background: var(--color-success); /* 绿色填充 */
}

/* 旋转关键帧 */
@keyframes discover-spin {
  to {
    transform: rotate(360deg); /* 完整一圈 */
  }
}

.discover-status-text {
  font-size: var(--text-sm); /* 12px */
  color: var(--text); /* 主文字色 */
}

.discover-status-round {
  font-size: var(--text-xs); /* 11px */
  color: var(--muted); /* 辅助文字色 */
}

/* ---- 手动配置面板 ---- */
.manual-config {
  display: flex; /* Flex 列布局 */
  flex-direction: column;
  gap: var(--spacing-md); /* 每个输入框间距 8px */
  padding: var(--spacing-md) 0; /* 上下 8px 间距 */
}

/* ---- 齿轮按钮 ---- */
.gear-btn {
  position: absolute; /* 相对于 .login-page 绝对定位 */
  right: var(--spacing-xl); /* 右下角：距右 16px */
  bottom: var(--spacing-xl); /* 右下角：距底 16px */
}

/* 齿轮激活态：accent 色高亮 */
.gear-btn--active {
  color: var(--accent) !important; /* 金色高亮，覆盖 Button subtle 默认色 */
}
</style>
