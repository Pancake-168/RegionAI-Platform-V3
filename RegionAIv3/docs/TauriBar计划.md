# TauriBar — Vue 版标题栏组件计划

## 目标

参照 React 版 `TauriBar.tsx`（69行），创建 Vue 版标题栏组件，提供：

- 窗口拖拽区域（`-webkit-app-region: drag`）
- 左侧 Logo + 应用标题
- 右侧窗口控制按钮（主题切换、最小化、最大化/还原、关闭）
- 仅 Tauri 桌面端渲染，浏览器环境返回空

## 源文件分析

| React 源              | 用途                                         |
| --------------------- | -------------------------------------------- |
| `TauriBar.tsx`        | 组件逻辑：窗口状态、按钮事件、条件渲染       |
| `TauriBar.module.css` | 布局样式：drag 区域、拖拽条、按钮 hover 效果 |
| `useIsHome()`         | React hook，判断当前路由是否为首页           |
| `isTauri()`           | 环境检测，非 Tauri 返回 `null`               |

---

## Vue 实现方案

### 文件变更

| 操作      | 文件                                 | 说明                                         |
| --------- | ------------------------------------ | -------------------------------------------- |
| 复制+修改 | `src/components/TauriBar.module.css` | 从 React 复制，关闭按钮 hover 色需加注释说明 |
| 新建      | `src/components/TauriBar.vue`        | Vue SFC 组件                                 |
| 修改      | `src/App.vue`                        | 在 `.app-layout` 顶部插入 `<TauriBar />`     |

### TauriBar.vue 设计

**Props**：无

**关键逻辑（含完整 `<script setup>`）**：

```ts
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { isTauri } from '@/utils/isTauri'
import { useTheme } from '@/composables/useTheme'
import type { Window } from '@tauri-apps/api/window'
import styles from './TauriBar.module.css'

const BASE_URL = import.meta.env.BASE_URL
const { theme, toggleTheme } = useTheme()
const route = useRoute()

const appWindow = ref<Window | null>(null)
const maximized = ref(false)
let unlistenResize: (() => void) | undefined

const isHome = computed(() => route.path === '/')

const themeIcon = computed(() =>
  theme.value === 'dark'
    ? 'material-symbols:light-mode'
    : 'material-symbols:dark-mode',
)

onMounted(async () => {
  if (!isTauri()) return // ← 必须守卫，防止浏览器环境调用 Tauri API
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  const win = getCurrentWindow()
  appWindow.value = win
  maximized.value = await win.isMaximized()
  unlistenResize = await win.onResized(() => {
    win.isMaximized().then((v) => (maximized.value = v))
  })
})

onUnmounted(() => {
  unlistenResize?.() // ← 清理 resize 监听，防止内存泄漏（比 React 版改进）
})

function minimize() {
  appWindow.value?.minimize()
}
function toggleMaximize() {
  appWindow.value?.toggleMaximize()
}
function close() {
  appWindow.value?.close()
}
```

**图标映射**：

| React (react-icons) | Vue (@iconify/vue)            |
| ------------------- | ----------------------------- |
| `VscChromeMinimize` | `codicon:chrome-minimize`     |
| `VscChromeMaximize` | `codicon:chrome-maximize`     |
| `VscChromeRestore`  | `codicon:chrome-restore`      |
| `VscChromeClose`    | `codicon:chrome-close`        |
| `MdDarkMode`        | `material-symbols:dark-mode`  |
| `MdLightMode`       | `material-symbols:light-mode` |

**模板结构**：

```html
<header v-if="isTauri()" :class="styles.bar">
  <span :class="styles.left">
    <img :class="styles.logo" :src="`${BASE_URL}tauri.svg`" alt="" />
    <span :class="styles.title">RegionAI</span>
  </span>
  <span :class="styles.spacer" />
  <button
    v-if="!isHome"
    :class="styles.btn"
    title="切换主题"
    @click="toggleTheme"
  >
    <Icon :icon="themeIcon" :width="16" />
  </button>
  <button :class="styles.btn" title="最小化" @click="minimize">
    <Icon icon="codicon:chrome-minimize" :width="14" />
  </button>
  <button :class="styles.btn" title="最大化" @click="toggleMaximize">
    <Icon
      :icon="maximized ? 'codicon:chrome-restore' : 'codicon:chrome-maximize'"
      :width="14"
    />
  </button>
  <button :class="[styles.btn, styles.btnClose]" title="关闭" @click="close">
    <Icon icon="codicon:chrome-close" :width="14" />
  </button>
</header>
```

**Logo 图片**：使用 `public/` 下已存在的 `tauri.svg`（后续自行替换为项目 Logo）。

### CSS Module 注意事项

**`.btnClose:hover` 的红色是故意写死的**，不是疏忽：

```css
.btnClose:hover {
  background: #e81123; /* Windows 系统关闭按钮惯例色，不随主题变化 */
  color: #fff; /* 红色背景上的白色文字 */
}
```

复制 CSS 时需在文件顶部加一行注释说明，避免后续被当成 bug 改掉：

```css
/* 注意：.btnClose:hover 的 background 和 color 是故意写死值 —— Windows 惯例 */
```

### App.vue 集成

```html
<template>
  <ToastProvider>
    <div class="app-layout">
      <TauriBar />
      <div class="main-page">
        <nav class="app-nav">...</nav>
        <div class="app-content">
          <router-view />
        </div>
      </div>
    </div>
  </ToastProvider>
</template>
```

TauriBar 高度 32px（`--titlebar-height`），与 `.app-layout` 的 flex 布局兼容。

### 关键适配点

1. **动态 import**：`onMounted` 中 `await import('@tauri-apps/api/window')`，且内部先 `if (!isTauri()) return` 守卫
2. **Resize 监听**：`onResized()` 返回 `Promise<UnlistenFn>`，存为闭包变量，`onUnmounted` 中调用清理（React 版未实现）
3. **首页检测**：`useRoute().path === '/'`，首页隐藏主题切换按钮
4. **`BASE_URL`**：在 `<script setup>` 中定义 `const BASE_URL = import.meta.env.BASE_URL`
5. **`themeIcon`**：computed 根据 `theme.value` 切换图标

### 验证

- `npm run build` 零错误
- Tauri 桌面端：顶部 32px 标题栏，可拖拽、窗口按钮正常
- 浏览器 dev server：`isTauri()` 返回 false，标题栏不渲染
- 亮/暗主题切换按钮正常
