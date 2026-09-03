# 迁移 Pancake CSS 体系 + 44 个 Common 组件到 Vue

## 上下文

- **源（React）**：`D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Client\Tauri-React\Pancake-Tauri-React\`
- **目标（Vue）**：`D:\Region\RegionAI-Patform-V3\Admin\`
- **规范依据**：目标项目 `docs/UI规则与新建页面注意事项（必读）.md`、`docs/基础组件规范.md`
- **目标**：全局 CSS 与 44 个 common 组件在 Vue 项目中重写为 **Vue 翻版**。
- **原则**：除了底层使用 Vue 3 + Reka UI 外，组件名称、分区、props 语义、样式、交互逻辑必须与目标项目完全一致。

---

## 技术决策

| 决策        | 选型                                                                          | 原因                                                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Headless UI | **Reka UI** (`reka-ui`)                                                       | Radix UI 的官方 Vue 端口，API 一致                                                                                                                               |
| 图标库      | **@iconify/vue** + `@iconify-json/codicon` + `@iconify-json/material-symbols` | `react-icons/vsc` = `@vscode/codicons` → Iconify `codicon:` 前缀；`react-icons/md` → Iconify `material-symbols:` 前缀；离线数据包确保 Tauri 桌面端无网络也能渲染 |
| 主题状态    | **Composable** (`useTheme`)                                                   | React 是副作用导入即执行，Vue composable 惰性需主动调用                                                                                                          |
| CSS Modules | `<script setup>` 中 `import styles from './xxx.module.css'`                   | 外部 `.module.css` 样式与目标一致，Vite 原生支持                                                                                                                 |
| Toast       | 全局函数 + Composable 订阅，`toast()` + `ToastProvider`                       | 与 React 版模式一致，函数和组件分开导出                                                                                                                          |

---

## 组件总表（44 个）

```
§1   Button              §16  EmptyState          §31 Toggle
§2   IconContainer       §17  Skeleton            §32 VisuallyHidden
§3   Input               §18  Accordion           §33 Drawer
§4   Textarea            §19  AlertDialog         §34 SegmentedControl
§5   Select              §20  AspectRatio         §35 Rating
§6   Switch              §21  Checkbox            §36 Breadcrumb
§7   Tooltip             §22  Collapsible         §37 Combobox
§8   Popover             §23  HoverCard           §38 CommandPalette
§9   DropdownMenu        §24  Label               §39 Stepper
§10  ContextMenu         §25  Menubar             §40 Toolbar
§11  Dialog              §26  NavigationMenu      §41 Calendar
§12  Confirm             §27  Progress            §42 DatePicker
§13  Toast               §28  RadioGroup          §43 TreeSelect
§14  Tabs                §29  Separator           §44 Cascader
§15  ScrollArea          §30  Slider
```

---

## Phase 1：基础设施

### 1.1 安装依赖

```bash
npm install reka-ui @iconify/vue @iconify-json/codicon @iconify-json/material-symbols vue-router
```

依赖说明：

- `reka-ui` — Radix UI 的 Vue 端口
- `@iconify/vue` — Iconify 的 Vue 封装
- `@iconify-json/codicon` — VS Code codicons 离线图标数据（对应 `react-icons/vsc`）
- `@iconify-json/material-symbols` — Material Design 离线图标数据（对应 `react-icons/md`）

### 1.2 共享类型文件

**文件**：`src/components/common/types.ts`

类型需覆盖 44 个组件需要的公共类型，至少包含：

```ts
export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  icon?: any
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

### 1.3 TypeScript 严格模式约束

`tsconfig.json` 相关配置：

```json
"strict": true,
"noUnusedLocals": true,
"noUnusedParameters": true
```

注意：所有 `import type` 导入的类型必须被使用；barrel export 中重导出类型如无消费者会触发 `noUnusedLocals`，可让消费者直接从 `types.ts` 导入。

### 1.4 主题 Composable

**文件**：`src/composables/useTheme.ts`

- 与目标项目行为一致：首次无 localStorage 时默认 **light**
- 读取/写入 key：`pancake-theme`
- 调用 `document.documentElement.setAttribute('data-theme', theme)`
- Vue 中需由 `App.vue` 显式调用 `useTheme()` 完成初始化

### 1.5 Toast 基础设施

- `src/composables/useToast.ts`：模块级单例 + composable 订阅
- `src/components/common/ToastProvider.vue`：Reka Toast Provider
- 行为与目标 Toast 一致：四种变体、duration、action、右侧堆叠、自动消失

---

## Phase 2：无 Headless UI 依赖的基础组件（§1、§2、§16、§17 等）

以下组件没有复杂浮层/表单原语依赖，可直接实现：

- `Button.vue`：全局 `.btn.*` + `.spinning`，支持 variant / loading / loadingText / disabled / block / icon slot
- `IconContainer.vue`：`src` 字符串渲染图片，默认 slot 渲染图标组件，支持 fallback
- `EmptyState.vue`：`#icon`、`#action` slot
- `Skeleton.vue`：text / circle / rect / count / shimmer

样式必须与目标项目对应 CSS 完全一致，禁止叠加外阴影/外发光。

---

## Phase 3：Reka UI 基础封装（§3～§15）

目标项目这些组件底层是 Radix，Vue 版使用 Reka 对应原语：

| Vue 组件           | Reka 主要原语                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `Input.vue`        | 无 Reka；样式对齐目标 Input（含 number 控件能力）                                                             |
| `Textarea.vue`     | 无 Reka；共享 Input.module.css                                                                                |
| `Select.vue`       | `SelectRoot`、`SelectTrigger`、`SelectValue`、`SelectPortal`、`SelectContent`、`SelectItem`                   |
| `Switch.vue`       | `SwitchRoot`、`SwitchThumb`                                                                                   |
| `Tooltip.vue`      | `TooltipProvider`、`TooltipRoot`、`TooltipTrigger`、`TooltipPortal`、`TooltipContent`、`TooltipArrow`         |
| `Popover.vue`      | `PopoverRoot`、`PopoverTrigger`、`PopoverPortal`、`PopoverContent`、`PopoverArrow`                            |
| `Tabs.vue`         | `TabsRoot`、`TabsList`、`TabsTrigger`、`TabsContent`                                                          |
| `ScrollArea.vue`   | `ScrollAreaRoot`、`ScrollAreaViewport`、`ScrollAreaScrollbar`、`ScrollAreaThumb`                              |
| `Dialog.vue`       | `DialogRoot`、`DialogTrigger`、`DialogPortal`、`DialogOverlay`、`DialogContent`、`DialogTitle`、`DialogClose` |
| `Confirm.vue`      | 基于 Dialog                                                                                                   |
| `DropdownMenu.vue` | `DropdownMenuRoot`、`DropdownMenuTrigger`、`DropdownMenuContent`、`DropdownMenuItem`、`DropdownMenuSeparator` |
| `ContextMenu.vue`  | `ContextMenuRoot`、`ContextMenuTrigger`、`ContextMenuContent`、`ContextMenuItem`、`ContextMenuSeparator`      |

关键适配：

- `asChild` → `as-child` + slot
- `checked / onCheckedChange` → `:model-value` / `@update:model-value`
- `value / onValueChange` → `:model-value` / `@update:model-value`
- `open / onOpenChange` → `:open` / `@update:open`
- ReactNode props → Vue 使用 slot 或 `h()` VNode

---

## Phase 4：Reka UI 扩展封装（§18～§32）

对应目标 `Accordion` 到 `VisuallyHidden`，Vue 版底层改用 Reka：

- `Accordion.vue`：`AccordionRoot`、`AccordionItem`、`AccordionTrigger`、`AccordionContent`
- `AlertDialog.vue`：`AlertDialogRoot`、`AlertDialogTrigger`、`AlertDialogOverlay`、`AlertDialogContent`
- `AspectRatio.vue`：`AspectRatioRoot`
- `Checkbox.vue`：`CheckboxRoot`、`CheckboxIndicator`
- `Collapsible.vue`：`CollapsibleRoot`、`CollapsibleTrigger`、`CollapsibleContent`
- `HoverCard.vue`：`HoverCardRoot`、`HoverCardTrigger`、`HoverCardContent`
- `Label.vue`：`LabelRoot`
- `Menubar.vue`：`MenubarRoot`、`MenubarMenu`、`MenubarTrigger`、`MenubarContent`
- `NavigationMenu.vue`：`NavigationMenuRoot`、`NavigationMenuList`、`NavigationMenuItem`
- `Progress.vue`：`ProgressRoot`、`ProgressIndicator`
- `RadioGroup.vue`：`RadioGroupRoot`、`RadioGroupItem`、`RadioGroupIndicator`
- `Separator.vue`：`SeparatorRoot`
- `Slider.vue`：`SliderRoot`、`SliderTrack`、`SliderRange`、`SliderThumb`
- `Toggle.vue`：`ToggleRoot`
- `VisuallyHidden.vue`：`VisuallyHiddenRoot`

> 若某个组件在 Reka UI 中没有完全同名原语，按目标组件的实现结构使用最接近的 Reka 原语，并把 props 映射到 Vue 写法。

---

## Phase 5：扩展控件（§33～§44）

这些组件大多由基础组件组合而成，Vue 版按目标组件相同组合方式实现：

- `Drawer.vue` — Dialog 方向变体
- `SegmentedControl.vue` — RadioGroup 分段样式
- `Rating.vue` — RadioGroup 星级
- `Breadcrumb.vue` — 导航痕迹
- `Combobox.vue` — Popover + Input
- `CommandPalette.vue` — Dialog + 搜索命令面板
- `Stepper.vue` — 步骤条
- `Toolbar.vue` — Reka Toolbar
- `Calendar.vue` — 日历面板
- `DatePicker.vue` — Popover + Calendar
- `TreeSelect.vue` — Popover + 树形数据
- `Cascader.vue` — Popover + 多级路径数据

每个组件的 props、行为、样式细节均以目标项目 `docs/基础组件规范.md` 和源码为准。

---

## Phase 6：Barrel Export 与 CSS 对齐

### 6.1 Barrel export

`src/components/common/index.ts` 统一导出全部 44 个组件。

### 6.2 CSS Module 对齐

从目标项目复制/对齐以下样式文件（Vue 中继续使用同名 `.module.css`）：

```
IconContainer.module.css
Input.module.css
Select.module.css
Switch.module.css
Tooltip.module.css
Popover.module.css
DropdownMenu.module.css
Dialog.module.css
Toast.module.css
Tabs.module.css
ScrollArea.module.css
Skeleton.module.css
```

以及 §18～§44 所需 CSS Module。

### 6.3 必须消除的差异

- 已有组件不得保留目标没有的外阴影、focus 光晕
- border 存在时禁止外发光/外阴影
- 颜色、圆角、阴影、模糊值只能引用 `var(--xxx)`
- 组件 props/API 语义向目标看齐，只是 Vue 使用 `v-model`、`@update:*`、slot / `h()` VNode

### 6.4 验证步骤

1. `npm run build` 零错误
2. `npm run dev` 后访问 `/demo`
3. DemoPage 按 §1～§44 顺序渲染，每个组件与目标 DemoPage 逐项对照
4. 亮/暗主题下检查浮层、表单、弹窗对比度与目标一致
5. Toast、Dialog、Select、DropdownMenu、ContextMenu 等交互行为与目标一致
