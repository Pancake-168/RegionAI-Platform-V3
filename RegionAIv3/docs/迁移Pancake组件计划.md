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
| 图标库 | **@iconify/vue** | 覆盖 vscode-icons 和 material-design 图标集 |
| 主题状态 | **Composable** (`useTheme`) | 20 行逻辑，不需要 Pinia |
| CSS Modules | `<style module>` + 复制 `.module.css` 文件 | 纯 CSS 零改动，Vite 原生支持 |
| Toast | 全局函数 + Composable 订阅 | 与 React 版模式一致 |

---

## Phase 1：基础设施

### 1.1 安装依赖
```bash
cd D:\Region\RegionAI-Patform-V3\RegionAIv3
npm install reka-ui @iconify/vue
```

### 1.2 导入全局 CSS
**文件**：`src/main.ts`
在第一行添加：`import '@/styles/index.css'`

### 1.3 创建主题 Composable
**文件**：`src/composables/useTheme.ts`
- `ref<'dark'|'light'>`，默认 `'light'`
- `watchEffect` 同步 `data-theme` 属性到 `document.documentElement`
- 持久化到 `localStorage` key `pancake-theme`
- 导出 `useTheme` 函数和 `Theme` 类型

### 1.4 复制字体文件
从 React 项目 `public/fonts/` 复制到 Vue 项目 `public/fonts/`：
- `优设标题黑.woff2`
- `优设标题黑.ttf`

### 1.5 创建共享类型文件
**文件**：`src/components/common/types.ts`
提取跨组件共用的类型：`ButtonVariant`、`SelectOption`、`MenuItem`、`TabItem`、`ToastVariant`、`ToastInstance`、`ToastAction`

### 1.6 清理 App.vue
替换 Tauri 脚手架模板为 Pancake 布局结构：
```html
<template>
  <ToastProvider>
    <div class="app-layout">
      <div class="main-page">
        <nav class="app-nav">...</nav>
        <div class="app-content"><router-view /></div>
      </div>
    </div>
  </ToastProvider>
</template>
```
移除所有 `<style>` 块（全局 CSS 已覆盖）。

---

## Phase 2：无 Headless UI 依赖的组件（纯 HTML + CSS）

按顺序实现，每个组件一个 `.vue` 文件。

### 2.1 Button (`Button.vue`)
- 无 Radix 依赖，无 CSS Module
- 使用全局 `.btn.*` 类：`['btn', variant, { spinning: loading }]`
- Props: `variant`、`loading`、`loadingText`、`type`
- Slots: `#icon`（图标）、`default`（文字）
- loading 态禁用点击并显示 `loadingText`

### 2.2 IconContainer (`IconContainer.vue`)
- CSS Module：`IconContainer.module.css`（复制）
- Props: `size`、`shape`
- 两种模式：`src` 字符串 → `<img>`；默认 slot → 直接渲染
- 图片加载失败自动显示 fallback 图标

### 2.3 Input (`Input.vue`)
- CSS Module：`Input.module.css`（复制）
- `v-model` 模式（`modelValue` + `@update:modelValue`）
- Props: `label`、`helper`、`error`、`type`、`disabled`
- error 状态切换 `$style.hasError` 类

### 2.4 Textarea (`Textarea.vue`)
- 复用 `Input.module.css`
- 与 Input 几乎相同，追加 `$style.textarea` 类和 `rows` prop

### 2.5 EmptyState (`EmptyState.vue`)
- 无 CSS Module，全部内联 `:style` 引用 `var(--xxx)`
- Props: `title`、`description`
- Slots: `#icon`、`#action`
- 虚线边框 + 居中布局

### 2.6 Skeleton (`Skeleton.vue`)
- CSS Module：`Skeleton.module.css`（复制）
- Props: `variant`、`width`、`height`、`count`
- 多行文本模式：最后一行 70% 宽度
- shimmer 动画纯 CSS

---

## Phase 3：简单 Reka UI 组件（1:1 API 映射）

每个组件的 CSS Module 文件从 React 项目**原样复制**。

### 3.1 Switch (`Switch.vue`)
- Reka：`SwitchRoot`、`SwitchThumb`
- `checked` → `:model-value`，`onCheckedChange` → `@update:model-value`

### 3.2 Tooltip (`Tooltip.vue`)
- Reka：`TooltipProvider`、`TooltipRoot`、`TooltipTrigger`、`TooltipPortal`、`TooltipContent`、`TooltipArrow`
- `asChild` → `as-child` 属性，子元素通过默认 slot 传入

### 3.3 Popover (`Popover.vue`)
- Reka：`PopoverRoot`、`PopoverTrigger`、`PopoverPortal`、`PopoverContent`、`PopoverArrow`
- 触发器用命名 slot `#trigger`

### 3.4 Tabs (`Tabs.vue`)
- Reka：`TabsRoot`、`TabsList`、`TabsTrigger`、`TabsContent`
- `tabs` 数组用 `v-for` 遍历
- `defaultValue` → `default-value`

### 3.5 ScrollArea (`ScrollArea.vue`)
- Reka：`ScrollAreaRoot`、`ScrollAreaViewport`、`ScrollAreaScrollbar`、`ScrollAreaThumb`
- 结构完全对应，`maxHeight` 通过 `:style` 传给 Viewport

---

## Phase 4：中等复杂度 Reka UI 组件

### 4.1 Select (`Select.vue`)
- Reka：`SelectRoot`、`SelectTrigger`、`SelectValue`、`SelectIcon`、`SelectPortal`、`SelectContent`、`SelectViewport`、`SelectItem`、`SelectItemText`
- 下拉图标：`<Icon icon="vscode-icons:chevron-down" />`
- `options` 数组 `v-for` 渲染 `SelectItem`

### 4.2 Dialog (`Dialog.vue`)
- Reka：`DialogRoot`、`DialogTrigger`、`DialogPortal`、`DialogOverlay`、`DialogContent`、`DialogTitle`、`DialogDescription`、`DialogClose`
- `open` + `@update:open` 受控模式
- 关闭按钮用 `as-child`：`<DialogClose as-child><button class="icon-btn">...`
- CSS Module 包含 `.footer`、`.footerLeft`（供 Confirm 复用）

### 4.3 DropdownMenu (`DropdownMenu.vue`)
- Reka：`DropdownMenuRoot`、`DropdownMenuTrigger`、`DropdownMenuPortal`、`DropdownMenuContent`、`DropdownMenuItem`、`DropdownMenuSeparator`
- **关键**：用 `MenuItemRenderer` 内部组件渲染每个菜单项（separator / 普通项 / danger 项）
- 右键快捷方式显示在右侧 muted

### 4.4 ContextMenu (`ContextMenu.vue`)
- Reka：`ContextMenuRoot`、`ContextMenuTrigger`、`ContextMenuPortal`、`ContextMenuContent`、`ContextMenuItem`、`ContextMenuSeparator`
- **完全复用** DropdownMenu 的 `MenuItemRenderer` 和 CSS Module
- Reka 的 ContextMenu 和 DropdownMenu 是不同组件，需分别注入

### 4.5 Confirm (`Confirm.vue`)
- 基于 Dialog 封装，无直接 Reka 依赖
- 预置 footer 按钮栏：`[取消] [...额外按钮] [确认]`
- `variant='danger'` 时确认按钮使用 `danger` 变体

---

## Phase 5：Toast 系统（最复杂）

### 5.1 创建 Toast Composable
**文件**：`src/composables/useToast.ts`
- 模块级 `toastListeners` 数组（React 模式 1:1 翻译）
- 导出独立函数 `toast(message, variant?)`，可在任何地方调用
- 导出 `useToastViewport()` composable 供组件订阅

### 5.2 创建 ToastProvider 组件 (`Toast.vue`)
- Reka：`ToastProvider`、`ToastViewport`、`ToastRoot`、`ToastClose`
- 包裹 `<slot />` + 内部 `<ToastViewportComponent>`
- 每条 toast：左边色点（复用 `.pill.{variant}` 类）+ 消息 + 可选操作按钮 + 关闭按钮
- 入场/退场动画在 CSS Module 中已定义

### 5.3 注册到 App.vue
`<ToastProvider>` 包裹整个应用

---

## Phase 6：整合验证

### 6.1 创建 barrel export
**文件**：`src/components/common/index.ts`
导出全部 17 个组件 + 类型 + `toast` 函数

### 6.2 复制全部 12 个 CSS Module 文件
```
IconContainer.module.css  Input.module.css    Select.module.css
Switch.module.css         Tooltip.module.css   Popover.module.css
DropdownMenu.module.css   Dialog.module.css    Toast.module.css
Tabs.module.css           ScrollArea.module.css Skeleton.module.css
```

### 6.3 验证
- `npm run build`（`tsc && vite build`）零错误
- 浏览器 dev server：主题切换正常、组件渲染正常
- `toast('test')` 控制台调用正常弹出和自动消失

---

## 全部文件清单

### 新建文件（`src/` 下）
```
composables/useTheme.ts
composables/useToast.ts
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
components/common/Toast.vue
components/common/Tabs.vue
components/common/ScrollArea.vue
components/common/EmptyState.vue
components/common/Skeleton.vue
```

### 复制文件
```
React: src/components/common/*.module.css (12 files) → Vue: src/components/common/
React: public/fonts/* (2 files) → Vue: public/fonts/
```

### 修改文件
```
src/main.ts — 添加 global CSS import
src/App.vue — 替换为 Pancake 布局 + ToastProvider
```

---

## 关键 API 映射速查

| React (Radix) | Vue (Reka) |
|---|---|
| `asChild` prop | `as-child` attribute + slot |
| `checked` / `onCheckedChange` | `:model-value` / `@update:model-value` |
| `value` / `onValueChange` | `:model-value` / `@update:model-value` |
| `open` / `onOpenChange` | `:open` / `@update:open` |
| `useId()` | `useId()` (Vue 3.5+) |
| `react-icons/vsc` | `@iconify/vue` → `vscode-icons:` 前缀 |
| `react-icons/md` | `@iconify/vue` → `material-design:` 前缀 |
| Zustand `create()` | `ref` + `watchEffect` composable |
| React Context (Toast) | 模块级单例 + composable 订阅 |
