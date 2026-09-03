# Vue DemoPage — Common 组件展示页

## 目标

以目标项目 `docs/UI规则与新建页面注意事项（必读）.md` 和 `docs/基础组件规范.md` 为唯一规范依据，在 Vue 项目中实现与 React `DemoPage.tsx` 对应的组件展示页面，完整展示 **44 个 Vue 版基础 UI 组件**（§1～§44）。

Vue 版原则：**除底层使用 Vue 3 + Reka UI 外，组件名称、展示分区、样式、交互逻辑必须与目标项目保持一致。**

## 对比源

| React                                       | Vue                               |
| ------------------------------------------- | --------------------------------- |
| `DemoPage.tsx`                              | `src/views/DemoPage.vue`          |
| `react-icons/vsc` → VscHome, VscGithub, ... | `@iconify/vue` → 见下方图标映射表 |
| `useState`                                  | `ref`                             |
| `className`                                 | `:class`                          |
| `style={{...}}`                             | `:style="{...}"`                  |
| `asChild` + ReactNode                       | slot / `h()` VNode                |
| `onChange={setVal}`                         | `v-model` / `@update:modelValue`  |
| `onOpenChange`                              | `@update:open`                    |
| `onConfirm` / `onCancel`                    | `@confirm` / `@cancel`            |
| `Radix UI`                                  | `Reka UI`（Radix 官方 Vue 端口）  |

---

## 图标映射表

React `react-icons/vsc` / `react-icons/md` 全部映射为 Iconify：

| React (react-icons/vsc) | Iconify                 |
| ----------------------- | ----------------------- |
| `VscHome`               | `codicon:home`          |
| `VscGithub`             | `codicon:github`        |
| `VscSettingsGear`       | `codicon:settings-gear` |
| `VscEdit`               | `codicon:edit`          |
| `VscTrash`              | `codicon:trash`         |
| `VscCopy`               | `codicon:copy`          |
| `VscInfo`               | `codicon:info`          |
| `VscError`              | `codicon:error`         |
| `VscAdd`                | `codicon:add`           |
| `VscSearch`             | `codicon:search`        |
| `VscRefresh`            | `codicon:refresh`       |
| `VscPerson`             | `codicon:person`        |
| `VscBell`               | `codicon:bell`          |

---

## 实现要点

### 1. 路由注册

- 在 `src/router/index.ts` 添加 `/demo` 路由 → `DemoPage.vue`

### 2. Helper 组件

- `Section` — 区块标题栏
- `Row` — 行内示例容器

### 3. 状态变量

按目标 DemoPage 逐一补齐，至少包含：

| 变量                 | 默认值            | 说明         |
| -------------------- | ----------------- | ------------ |
| `inputValue`         | `ref('')`         | 普通输入     |
| `inputErrorValue`    | `ref('错误内容')` | 错误状态输入 |
| `textareaValue`      | `ref('')`         | 多行文本     |
| `selectValue`        | `ref('')`         | 下拉选择     |
| `switchOn`           | `ref(false)`      | 开关         |
| `dialogOpen`         | `ref(false)`      | 外部受控弹窗 |
| `confirmDefaultOpen` | `ref(false)`      | 默认确认     |
| `confirmDangerOpen`  | `ref(false)`      | 危险确认     |
| `confirmExtraOpen`   | `ref(false)`      | 额外按钮确认 |
| `activeTabLog`       | `ref('tab-1')`    | 当前标签     |

§18～§44 所需状态在实现时按目标 DemoPage 同步补齐。

### 4. 关键 API 适配

**Dialog/Confirm 事件**：

- React: `onOpenChange={setOpen}` → Vue: `@update:open="val => open = val"`
- React: `onConfirm={fn}` → Vue: `@confirm="fn"`
- React: `onCancel={fn}` → Vue: `@cancel="fn"`

**EmptyState 图标/操作**：

- React: `icon={<VscSearch size={48} />}`、`action={<Button>...</Button>}`（props）
- Vue: `<template #icon><Icon icon="codicon:search" :width="48" /></template>`、`<template #action><Button>...</Button></template>`（slots）

**VNode 内容**：

Vue 中 `TabItem.icon`、`TabItem.content`、`MenuItem.icon` 等需要 VNode 时使用 `h()`：

```ts
import { h } from 'vue'
const demoTabs = [
  {
    id: 'tab-1', label: '概览', icon: ...,
    content: h('p', { style: { color: 'var(--text)', fontSize: 'var(--text-base)' } }, '这是概览标签页的内容。')
  },
]
```

**Input/Textarea/Select 宽度**：外层包 `<div>` 控制宽度。

**Popover trigger**：

- React: `<Popover trigger={<button>...</button>}>`
- Vue: `<Popover><template #trigger><button>...</button></template>...</Popover>`

**Dialog trigger**（Vue 翻版必须提供与目标等价的内置 trigger 能力；Vue 中通过 `#trigger` slot 承载触发元素）：

- React: `<Dialog trigger={<button>...</button>}>`
- Vue: `<Dialog><template #trigger><button>...</button></template>...</Dialog>`

**IconContainer 组件模式**：

- React: `<IconContainer src={<VscGithub />} />`
- Vue: `<IconContainer><Icon icon="codicon:github" /></IconContainer>`

---

## 44 个组件展示区

### §1～§17 基础组件

| §   | 组件          | 展示变体                                       |
| --- | ------------- | ---------------------------------------------- |
| §1  | Button        | 四种变体 / 带图标 / Loading / 禁用             |
| §2  | IconContainer | 圆角方形 / 圆形 / 图标组件 / 加载失败 fallback |
| §3  | Input         | 基础 / 带标签 / 辅助说明 / 错误 / 禁用 / 数字  |
| §4  | Textarea      | 基础 / 带标签 / 错误 / 禁用                    |
| §5  | Select        | 基础 / 带标签 / 已选中 / 禁用                  |
| §6  | Switch        | 基础 / 带动态标签 / 开启态 / 禁用              |
| §7  | Tooltip       | 默认方向 / 四个方向 / 长延迟                   |
| §8  | Popover       | 表单卡片 / 三种对齐                            |
| §9  | DropdownMenu  | 完整菜单 / 纯文字菜单                          |
| §10 | ContextMenu   | 右键区域 / 禁用右键                            |
| §11 | Dialog        | Trigger触发 / 外部受控 / 无description         |
| §12 | Confirm       | 默认 / 危险 / 额外按钮                         |
| §13 | Toast         | 四种变体 / 带操作按钮 / 纯字符串快捷调用       |
| §14 | Tabs          | 带图标 / 纯文字                                |
| §15 | ScrollArea    | 固定高度滚动                                   |
| §16 | EmptyState    | 默认 / 带操作按钮 / 自定义图标                 |
| §17 | Skeleton      | 文本 / 段落 / 圆形 / 矩形                      |

### §18～§32 Reka UI 封装组件

| §   | 组件           | 展示要点          |
| --- | -------------- | ----------------- |
| §18 | Accordion      | 手风琴展开收起    |
| §19 | AlertDialog    | 关键操作确认      |
| §20 | AspectRatio    | 固定宽高比        |
| §21 | Checkbox       | 受控勾选 / 禁用   |
| §22 | Collapsible    | 展开/收起内容区   |
| §23 | HoverCard      | 悬停弹出卡片      |
| §24 | Label          | 点击聚焦关联控件  |
| §25 | Menubar        | 顶部菜单栏        |
| §26 | NavigationMenu | 导航菜单          |
| §27 | Progress       | 进度条            |
| §28 | RadioGroup     | 单选组 / 键盘操作 |
| §29 | Separator      | 横向/纵向分隔线   |
| §30 | Slider         | 数值滑块          |
| §31 | Toggle         | 按压态按钮        |
| §32 | VisuallyHidden | 视觉隐藏但可访问  |

### §33～§44 扩展控件

| §   | 组件             | 展示要点   |
| --- | ---------------- | ---------- |
| §33 | Drawer           | 方向抽屉   |
| §34 | SegmentedControl | 分段控件   |
| §35 | Rating           | 星级评分   |
| §36 | Breadcrumb       | 面包屑     |
| §37 | Combobox         | 可输入下拉 |
| §38 | CommandPalette   | 命令面板   |
| §39 | Stepper          | 步骤条     |
| §40 | Toolbar          | 工具栏     |
| §41 | Calendar         | 日历       |
| §42 | DatePicker       | 日期选择   |
| §43 | TreeSelect       | 树形选择   |
| §44 | Cascader         | 级联选择   |

---

## 文件变更

| 操作 | 文件                                      |
| ---- | ----------------------------------------- |
| 新建 | `src/views/DemoPage.vue`                  |
| 修改 | `src/router/index.ts` — 添加 `/demo` 路由 |
| 新建 | 缺失的 §18～§44 Vue 版基础组件            |

## 验证

- `npm run build` 零错误
- `npm run dev` 浏览器访问 `/demo`，44 个组件全部渲染正常
- 与目标项目 DemoPage 逐节对照：组件外观、分区顺序、示例交互一致
