# 迁移 Pancake CSS 体系 + 17 个 Common 组件到 Vue

## 上下文

- **源（React）**：`D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Client\Tauri-React\Pancake-Tauri-React\`
- **目标（Vue）**：`D:\Region\RegionAI-Patform-V3\RegionAIv3\`
- **目标**：全局 CSS 完全照搬 Pancake 风格，17 个 common 组件重写为 Vue + Reka UI 版本
- **已完成**：`variables.css` 和 `index.css` 已复制到 Vue 项目的 `src/styles/` 下

---

## 技术决策

| 决策 | 选型 | 原因 |
|------|------|------|
| Headless UI | **Reka UI** (`reka-ui`) | Radix UI 的官方 Vue 端口，API 一致 |
| 图标库 | **@iconify/vue** + `@iconify-json/codicon` + `@iconify-json/material-symbols` | `react-icons/vsc` = `@vscode/codicons` → Iconify `codicon:` 前缀；`react-icons/md` → Iconify `material-symbols:` 前缀；离线数据包确保 Tauri 桌面端无网络也能渲染 |
| 主题状态 | **Composable** (`useTheme`)，在 `main.ts` 中显式调用初始化 | 20 行逻辑不需要 Pinia；React 是副作用导入即执行，Vue composable 惰性需主动调用 |
| CSS Modules | `<script setup>` 中 `import styles from './xxx.module.css'`，模板中用 `:class="styles.xxx"` | 外部 `.module.css` 文件原样复制零改动，Vite 原生支持 |
| Toast | 全局函数 + Composable 订阅，`toast()` 函数来自 `useToast.ts`，`ToastProvider` 组件来自 `ToastProvider.vue` | 与 React 版模式一致，函数和组件分开导出 |

---

## Phase 1：基础设施

### 1.1 安装依赖
```bash
cd D:\Region\RegionAI-Patform-V3\RegionAIv3
npm install reka-ui @iconify/vue @iconify-json/codicon @iconify-json/material-symbols vue-router
```

依赖说明：
- `reka-ui` — Radix UI 的 Vue 端口
- `@iconify/vue` — Iconify 的 Vue 封装
- `@iconify-json/codicon` — VS Code codicons 离线图标数据（对应 `react-icons/vsc`）
- `@iconify-json/material-symbols` — Material Design 离线图标数据（对应 `react-icons/md`）
- `vue-router` — Vue 官方路由（4.x 自带 TypeScript 类型定义，无需额外 `@types/*` 包）

### 1.2 创建路由配置文件
**文件**：`src/router/index.ts`（新建）
```ts
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  // Hash 模式 — Tauri 桌面端兼容（file:// 协议下 history 模式不可用）
  history: createWebHashHistory(),
  routes: [
    // 后续页面路由在此添加
  ],
})

export default router
```

### 1.3 更新 main.ts（导入全局 CSS + 保留 logger + 注册 router）
**文件**：`src/main.ts`
```ts
import '@/styles/index.css'
import { createApp } from 'vue'
import App from '@/App.vue'
import { registerGlobalErrorHandlers, registerTauriTransport } from '@/utils/logger'
import router from '@/router'

// logger 初始化 — 必须在应用挂载前执行
registerTauriTransport()
registerGlobalErrorHandlers()

const app = createApp(App)
app.use(router)
app.mount('#app')
```

注意：
- `registerTauriTransport()` 和 `registerGlobalErrorHandlers()` 是已有代码，**必须保留**
- 主题初始化不在 main.ts 中做副作用导入，而是由 App.vue 的 `<script setup>` 中调用 `useTheme()` 完成（见 1.8）
- Hash 路由模式与 React 版 Pancake 的 `HashRouter` 策略一致

### 1.4 创建主题 Composable
**文件**：`src/composables/useTheme.ts`
- `ref<'dark'|'light'>`，默认 `'light'`
- 函数体内立即读取 `localStorage` 并设置 `document.documentElement.setAttribute('data-theme', ...)` — 在 `useTheme()` 首次被调用时执行
- `watch(theme, ...)` 响应后续变化，同步 localStorage 和 DOM
- `toggleTheme()` 翻转 `theme.value`
- 导出 `useTheme` 函数和 `Theme` 类型

与 React 的关键区别：React 的 `theme.store.ts` 是模块顶层副作用（import 即执行），Vue composable 必须在 `App.vue` 的 `<script setup>` 中显式调用 `useTheme()` 才会初始化。

### 1.5 复制字体文件
从 React 项目 `public/fonts/` 复制到 Vue 项目 `public/fonts/`：
- `优设标题黑.woff2`
- `优设标题黑.ttf`

### 1.6 创建共享类型文件
**文件**：`src/components/common/types.ts`
```ts
// 注意：tsconfig 有 noUnusedLocals: true，此文件中所有类型必须被其他文件 import 消费。
// 使用 "export type" 确保编译后不产生运行时代码。

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface MenuItem {
  label: string
  icon?: any
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  separator?: true
  onClick?: () => void
}

export interface TabItem {
  id: string
  label: string
  icon?: any
  content: any
}

export type ToastVariant = 'success' | 'error' | 'warn' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastInstance {
  id: string
  message: string
  variant?: ToastVariant
  duration?: number
  action?: ToastAction
}
```

### 1.7 TypeScript 严格模式约束
`tsconfig.json` 相关配置：
```json
"strict": true,
"noUnusedLocals": true,
"noUnusedParameters": true
```

实施时需注意：
- 所有 `import type` 导入的类型必须被使用（作为 prop 类型注解、emits 类型注解、或 `typeof` 消费）
- Barrel export 中 re-export 的类型如果无消费者会触发 `noUnusedLocals`，考虑暂不放在 index.ts 中集中重导出类型，改为让消费者直接从 `types.ts` 导入
- `noUnusedLocals` 在变量声明处触发，`// @ts-ignore` 无法抑制（它只能抑制下一行表达式的错误）。正确做法是用 `_` 前缀命名未使用变量，或从根源上让类型由消费者直接从 `types.ts` 导入
- Vite 的 `vue-tsc` 对 `.vue` 文件中的类型导出可能与 `.ts` 文件行为不同，如遇到类型导出问题，统一将类型定义在 `types.ts` 中

### 1.8 替换 App.vue
当前 `src/App.vue` 是 Tauri 脚手架模板。完全替换为：

```vue
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import ToastProvider from '@/components/common/ToastProvider.vue'

// 初始化主题（首次调用时读取 localStorage 并设置 data-theme）
useTheme()
</script>

<template>
  <ToastProvider>
    <div class="app-layout">
      <div class="main-page">
        <nav class="app-nav">
          <!-- 导航链接后续配置 -->
        </nav>
        <div class="app-content">
          <router-view />
        </div>
      </div>
    </div>
  </ToastProvider>
</template>
```

移除所有 `<style>` 块（scoped 和 global），全局 CSS 已在 `index.css` 中定义。

注意：`<router-view />` 需要 vue-router 已安装并在 main.ts 中注册路由表（即使初始为空路由也要有 `createRouter` + `app.use(router)`）。

---

## Phase 2：无 Headless UI 依赖的组件（纯 HTML + CSS）

这 6 个组件零框架依赖，只需 `<script setup>` + `<template>` + CSS Module import。

### 2.1 Button (`Button.vue`)
- **CSS**：无 CSS Module，使用全局 `.btn .primary|.secondary|.subtle|.danger` 类
- **Props**：`variant?: ButtonVariant` (default `'primary'`)、`loading?: boolean`、`loadingText?: string`、`type?: 'button'|'submit'`
- **Slots**：`#icon`（图标）、`default`（按钮文字）
- loading 时：显示 `loadingText`、`disabled=true`、`.spinning` 类

### 2.2 IconContainer (`IconContainer.vue`)
- **CSS Module**：`IconContainer.module.css` ← 从 React 项目复制
- `<script setup>` 中：`import styles from './IconContainer.module.css'`
- 模板中：`:class="styles.container"`
- **Props**：`size: number`、`shape?: 'rounded'|'circle'`
- `src` prop 为字符串时渲染 `<img>`，加载失败显示 fallback（`codicon:question`）
- 默认 slot 有内容时直接渲染 slot（用于传入图标组件）

### 2.3 Input (`Input.vue`)
- **CSS Module**：`Input.module.css` ← 从 React 项目复制（被 Input 和 Textarea 共享）
- **Props**：`modelValue: string`、`label?`、`helper?`、`error?`、`type?`、`disabled?`
- **Emits**：`update:modelValue`
- error 状态下切换 `styles.hasError` 类

### 2.4 Textarea (`Textarea.vue`)
- **CSS Module**：共享 `Input.module.css`（同一文件，不重复复制）
- 与 Input 几乎相同，追加 `styles.textarea` 类和 `rows` prop

### 2.5 EmptyState (`EmptyState.vue`)
- **CSS**：无 CSS Module，全部内联 `:style` 绑定，值引用 `var(--xxx)`
- **Props**：`title: string`、`description?: string`
- **Slots**：`#icon`（默认 `codicon:folder-opened`）、`#action`

### 2.6 Skeleton (`Skeleton.vue`)
- **CSS Module**：`Skeleton.module.css` ← 从 React 项目复制
- **Props**：`variant?: 'text'|'circle'|'rect'`、`width?`、`height?`、`count?`
- 多行文本模式（`variant='text'` + `count > 1`）：最后一行宽 70%

---

## Phase 3：简单 Reka UI 组件（1:1 API 映射）

### 3.1 Switch (`Switch.vue`)
- **Reka**：`SwitchRoot`、`SwitchThumb`
- **CSS Module**：`Switch.module.css` ← 复制
- `checked` → `:model-value`，`onCheckedChange` → `@update:model-value`

### 3.2 Tooltip (`Tooltip.vue`)
- **Reka**：`TooltipProvider`、`TooltipRoot`、`TooltipTrigger`、`TooltipPortal`、`TooltipContent`、`TooltipArrow`
- **CSS Module**：`Tooltip.module.css` ← 复制
- `asChild` → `as-child` prop + 默认 slot

### 3.3 Popover (`Popover.vue`)
- **Reka**：`PopoverRoot`、`PopoverTrigger`、`PopoverPortal`、`PopoverContent`、`PopoverArrow`
- **CSS Module**：`Popover.module.css` ← 复制
- trigger 通过命名 slot `#trigger` 传入

### 3.4 Tabs (`Tabs.vue`)
- **Reka**：`TabsRoot`、`TabsList`、`TabsTrigger`、`TabsContent`
- **CSS Module**：`Tabs.module.css` ← 复制
- `defaultValue` → `default-value`（kebab-case）

### 3.5 ScrollArea (`ScrollArea.vue`)
- **Reka**：`ScrollAreaRoot`、`ScrollAreaViewport`、`ScrollAreaScrollbar`、`ScrollAreaThumb`
- **CSS Module**：`ScrollArea.module.css` ← 复制
- `maxHeight` 通过 `:style` 传给 `ScrollAreaViewport`

---

## Phase 4：中等复杂度 Reka UI 组件

### 4.1 Select (`Select.vue`)
- **Reka**：`SelectRoot`、`SelectTrigger`、`SelectValue`、`SelectIcon`、`SelectPortal`、`SelectContent`、`SelectViewport`、`SelectItem`、`SelectItemText`
- **CSS Module**：`Select.module.css` ← 复制
- **图标**：`<Icon icon="codicon:chevron-down" />`（注意不是 `vscode-icons:`）
- React 代码中 `.chevronOpen` 类并未被使用（CSS 中有定义但 TSX 中未切换），Vue 版本可以补上此功能：通过 Reka Select 的 open state 动态添加旋转类

### 4.2 Dialog (`Dialog.vue`)
- **Reka**：`DialogRoot`、`DialogTrigger`、`DialogPortal`、`DialogOverlay`、`DialogContent`、`DialogTitle`、`DialogDescription`、`DialogClose`
- **CSS Module**：`Dialog.module.css` ← 复制（被 Dialog 和 Confirm 共享）
- `open` + `@update:open` 受控模式
- 关闭按钮：`<DialogClose as-child><button class="icon-btn"><Icon icon="codicon:close" :size="16" /></button></DialogClose>`
- CSS Module 包含 `.footer`、`.footerLeft`（供 Confirm 复用）

### 4.3 DropdownMenu (`DropdownMenu.vue`)
- **Reka**：`DropdownMenuRoot`、`DropdownMenuTrigger`、`DropdownMenuPortal`、`DropdownMenuContent`、`DropdownMenuItem`、`DropdownMenuSeparator`
- **CSS Module**：`DropdownMenu.module.css` ← 复制（被 DropdownMenu 和 ContextMenu 共享）
- **关键设计**：提取 `<MenuItemRenderer>` 为内部组件（不导出），接收 `item: MenuItem` + `itemComponent` + `separatorComponent` props，供 DropdownMenu 和 ContextMenu 共用
- trigger 通过命名 slot `#trigger` 传入

### 4.4 ContextMenu (`ContextMenu.vue`)
- **Reka**：`ContextMenuRoot`、`ContextMenuTrigger`、`ContextMenuPortal`、`ContextMenuContent`、`ContextMenuItem`、`ContextMenuSeparator`
- **完全复用** DropdownMenu 的 `<MenuItemRenderer>` 和 `DropdownMenu.module.css`
- Reka 的 `ContextMenuItem`/`ContextMenuSeparator` 作为 props 传入 `MenuItemRenderer`

### 4.5 Confirm (`Confirm.vue`)
- 基于 Dialog 封装，无直接 Reka 依赖
- 共享 `Dialog.module.css`
- footer 按钮栏：左侧 `extraButtons`（v-for），右侧取消 + 确认
- `variant='danger'` 时确认按钮使用 `danger` 变体

---

## Phase 5：Toast 系统

### 5.1 创建 Toast Composable
**文件**：`src/composables/useToast.ts`
- 模块级私有 `toastListeners` 数组（不导出）
- 模块级私有 `toastCounter`
- **导出独立函数** `toast(messageOrConfig, variant?)` — 纯函数，可在任何 `.ts` 文件中调用，不依赖 Vue 组件上下文
- **导出 composable** `useToastViewport()` — 返回 `toasts: Ref<ToastInstance[]>` + `removeToast(id)`

### 5.2 创建 ToastProvider 组件
**文件**：`src/components/common/ToastProvider.vue`
- **Reka**：`ToastProvider`、`ToastViewport`、`ToastRoot`、`ToastClose`
- **CSS Module**：`Toast.module.css` ← 复制
- 包裹 `<slot />` + 内部 `<ToastViewportComponent>`（使用 `useToastViewport()`）
- 每条 toast：左边 8px 色点（复用全局 `.pill.success|.error|.warn|.info` 类）+ 消息 + 可选操作按钮 + 关闭按钮（`codicon:close`）
- 注意：此处用的图标是 `codicon:close`，不是 `vscode-icons:close`

### 5.3 导出结构
- `ToastProvider.vue` → 默认导出 `ToastProvider` 组件
- `useToast.ts` → 导出 `toast` 函数 + `useToastViewport` composable
- Barrel `index.ts` 分别从两个文件重导出

---

## Phase 6：整合验证

### 6.1 Barrel export
**文件**：`src/components/common/index.ts`

注意 tsconfig 的 `noUnusedLocals: true` 约束。类型重导出采用保守策略——类型让消费者直接从 `types.ts` 导入，barrel 只导出组件和函数：

```ts
// 组件
export { default as Button } from './Button.vue'
export { default as IconContainer } from './IconContainer.vue'
export { default as Input } from './Input.vue'
export { default as Textarea } from './Textarea.vue'
export { default as Select } from './Select.vue'
export { default as Switch } from './Switch.vue'
export { default as Tooltip } from './Tooltip.vue'
export { default as Popover } from './Popover.vue'
export { default as DropdownMenu } from './DropdownMenu.vue'
export { default as ContextMenu } from './ContextMenu.vue'
export { default as Dialog } from './Dialog.vue'
export { default as Confirm } from './Confirm.vue'
export { default as ToastProvider } from './ToastProvider.vue'
export { default as Tabs } from './Tabs.vue'
export { default as ScrollArea } from './ScrollArea.vue'
export { default as EmptyState } from './EmptyState.vue'
export { default as Skeleton } from './Skeleton.vue'

// Toast 函数（来自 composable，不是组件）
export { toast } from '@/composables/useToast'
```

### 6.2 复制全部 12 个 CSS Module 文件
```
IconContainer.module.css    — 仅 IconContainer 使用
Input.module.css            — Input 和 Textarea 共享
Select.module.css           — 仅 Select 使用
Switch.module.css           — 仅 Switch 使用
Tooltip.module.css          — 仅 Tooltip 使用
Popover.module.css          — 仅 Popover 使用
DropdownMenu.module.css     — DropdownMenu 和 ContextMenu 共享
Dialog.module.css           — Dialog 和 Confirm 共享
Toast.module.css            — 仅 ToastProvider 使用
Tabs.module.css             — 仅 Tabs 使用
ScrollArea.module.css       — 仅 ScrollArea 使用
Skeleton.module.css         — 仅 Skeleton 使用
```

共享关系：总共 12 个文件，17 个组件。Input.module.css、DropdownMenu.module.css、Dialog.module.css 各被两个组件共享，复制一次即可。

### 6.3 验证步骤
1. `npm run build`（`tsc && vite build`）零错误
   - 特别注意 `noUnusedLocals` 和 `noUnusedParameters` 报错
2. `npm run dev` 启动开发服务器，浏览器验证：
   - 主题默认亮色，切换正常，刷新后保持
   - 各组件渲染正常（建议创建一个临时 DemoPage 集中展示）
3. 控制台执行 `toast('测试消息', 'success')` — toast 正常弹出并自动消失

---

## 全部文件清单

### 新建文件（`src/` 下）
```
composables/useTheme.ts
composables/useToast.ts
router/index.ts
components/common/types.ts
components/common/index.ts
components/common/Button.vue
components/common/IconContainer.vue
components/common/Input.vue
components/common/Textarea.vue
components/common/Select.vue
components/common/Switch.vue
components/common/Tooltip.vue
components/common/Popover.vue
components/common/DropdownMenu.vue
components/common/ContextMenu.vue
components/common/Dialog.vue
components/common/Confirm.vue
components/common/ToastProvider.vue
components/common/Tabs.vue
components/common/ScrollArea.vue
components/common/EmptyState.vue
components/common/Skeleton.vue
```

### 复制到目标项目
```
源: React src/components/common/IconContainer.module.css  →  Vue: src/components/common/
源: React src/components/common/Input.module.css          →  Vue: src/components/common/
源: React src/components/common/Select.module.css         →  Vue: src/components/common/
源: React src/components/common/Switch.module.css         →  Vue: src/components/common/
源: React src/components/common/Tooltip.module.css        →  Vue: src/components/common/
源: React src/components/common/Popover.module.css        →  Vue: src/components/common/
源: React src/components/common/DropdownMenu.module.css   →  Vue: src/components/common/
源: React src/components/common/Dialog.module.css         →  Vue: src/components/common/
源: React src/components/common/Toast.module.css          →  Vue: src/components/common/
源: React src/components/common/Tabs.module.css           →  Vue: src/components/common/
源: React src/components/common/ScrollArea.module.css     →  Vue: src/components/common/
源: React src/components/common/Skeleton.module.css       →  Vue: src/components/common/
源: React public/fonts/优设标题黑.woff2                    →  Vue: public/fonts/
源: React public/fonts/优设标题黑.ttf                      →  Vue: public/fonts/
```

### 修改文件
```
src/main.ts    — 添加 global CSS import + router 注册，保留 logger 初始化
src/App.vue    — 替换为 Pancake 布局 + useTheme() + ToastProvider + router-view
```

---

## 关键 API 映射速查

### Radix React → Reka Vue

| React (Radix) | Vue (Reka) |
|---|---|
| `asChild` prop | `as-child` attribute + slot |
| `checked` / `onCheckedChange` | `:model-value` / `@update:model-value` |
| `value` / `onValueChange` | `:model-value` / `@update:model-value` |
| `open` / `onOpenChange` | `:open` / `@update:open` |
| `useId()` | `useId()` (Vue 3.5+) |
| Zustand `create()` | `ref` + `watch` composable |
| React Context (Toast) | 模块级单例 + composable 订阅 |

### react-icons → @iconify/vue

| react-icons 导入 | Iconify icon 字符串 | 所属离线包 |
|---|---|---|
| `VscClose` | `codicon:close` | `@iconify-json/codicon` |
| `VscChevronDown` | `codicon:chevron-down` | `@iconify-json/codicon` |
| `VscFolderOpened` | `codicon:folder-opened` | `@iconify-json/codicon` |
| `VscQuestion` | `codicon:question` | `@iconify-json/codicon` |
| `MdDarkMode` | `material-symbols:dark-mode` | `@iconify-json/material-symbols` |
| `MdLightMode` | `material-symbols:light-mode` | `@iconify-json/material-symbols` |
| `MdKeyboardArrowDown` | `material-symbols:keyboard-arrow-down` | `@iconify-json/material-symbols` |
| `MdKeyboardArrowUp` | `material-symbols:keyboard-arrow-up` | `@iconify-json/material-symbols` |

**注意**：`react-icons/vsc` = `@vscode/codicons`（VS Code UI 操作图标），不是 Iconify 的 `vscode-icons`（那是文件类型图标主题）。`react-icons/md` = Material Design icons，对应 `material-symbols:` 前缀。
