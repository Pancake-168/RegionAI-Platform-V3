# Vue DemoPage — Common 组件展示页

## 目标

参照 React 版 `DemoPage.tsx`（1045行），在 Vue 项目中创建一模一样的组件展示页面，逐一展示 17 个 common 组件的常规用法。

## 对比源

| React                                       | Vue                               |
| ------------------------------------------- | --------------------------------- |
| `DemoPage.tsx`                              | `src/views/DemoPage.vue`          |
| `react-icons/vsc` → VscHome, VscGithub, ... | `@iconify/vue` → 见下方图标映射表 |
| `useState`                                  | `ref`                             |
| `className`                                 | `:class`                          |
| `style={{...}}`                             | `:style="{...}"`                  |
| `asChild` + ReactNode                       | slot                              |
| `onChange={setVal}`                         | `v-model` / `@update:modelValue`  |
| `onOpenChange`                              | `@update:open`                    |
| `onConfirm` / `onCancel`                    | `@confirm` / `@cancel`            |

---

## 图标映射表

DemoPage 用到的全部 13 个图标：

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

- `Section` — 区块标题栏（内联样式，引用 var(--xxx) Token）
- `Row` — 行内示例容器

### 3. 状态变量（逐一与 React 对齐）

| 变量                 | 默认值            | 说明                                 |
| -------------------- | ----------------- | ------------------------------------ |
| `inputValue`         | `ref('')`         | 普通输入                             |
| `inputErrorValue`    | `ref('错误内容')` | 错误状态输入（**注意：非空字符串**） |
| `textareaValue`      | `ref('')`         | 多行文本                             |
| `selectValue`        | `ref('')`         | 下拉选择                             |
| `switchOn`           | `ref(false)`      | 开关                                 |
| `dialogOpen`         | `ref(false)`      | 外部受控弹窗                         |
| `confirmDefaultOpen` | `ref(false)`      | 默认确认                             |
| `confirmDangerOpen`  | `ref(false)`      | 危险确认                             |
| `confirmExtraOpen`   | `ref(false)`      | 额外按钮确认                         |
| `activeTabLog`       | `ref('tab-1')`    | 当前标签                             |

### 4. 关键 API 适配

**Dialog/Confirm 事件**：

- React: `onOpenChange={setOpen}` → Vue: `@update:open="val => open = val"`
- React: `onConfirm={fn}` → Vue: `@confirm="fn"`
- React: `onCancel={fn}` → Vue: `@cancel="fn"`

**EmptyState 图标**：

- React: `icon={<VscSearch size={48} />}` (prop)
- Vue: `<template #icon><Icon icon="codicon:search" :width="48" /></template>` (slot)

**Tabs content（使用 h() 创建 VNode）**：

```ts
import { h } from 'vue'
const demoTabs = [
  {
    id: 'tab-1', label: '概览', icon: ...,
    content: h('p', { style: { color: 'var(--text)', fontSize: 'var(--text-base)' } }, '这是概览标签页的内容。')
  },
  // ...
]
```

**Input/Textarea/Select 宽度（必须外层包 div）**：
Vue 中 `style` 和 `class` 始终合并到组件根元素。Input/Textarea/Select 的根元素是 wrapper div，不是输入元素本身。所以：

```html
<!-- ❌ 错误：宽度会加到 wrapper div 上 -->
<input style="width: 260px" />

<!-- ✅ 正确：外层包 div -->
<div style="width: 260px"><input /></div>
```

### 5. 其他适配

**Popover trigger**：

- React: `<Popover trigger={<button>...</button>}>`
- Vue: `<Popover><template #trigger><button>...</button></template>...</Popover>`

**Tooltip children**：

- React: `<Tooltip content="提示"><button>悬停</button></Tooltip>`
- Vue: `<Tooltip content="提示"><button>悬停</button></Tooltip>`（默认 slot）

**Dialog trigger**：

- React: `<Dialog trigger={<button>...</button>}>`
- Vue: `<Dialog><template #trigger><button>...</button></template>...</Dialog>`

**IconContainer 组件模式**：

- React: `<IconContainer src={<VscGithub />} />`
- Vue: `<IconContainer><Icon icon="codicon:github" /></IconContainer>`

---

## 17 个组件展示区

| §   | 组件          | 展示变体                                       |
| --- | ------------- | ---------------------------------------------- |
| §1  | Button        | 四种变体 / 带图标 / Loading / 禁用             |
| §2  | IconContainer | 圆角方形 / 圆形 / 图标组件 / 加载失败 fallback |
| §3  | Input         | 基础 / 带标签 / 辅助说明 / 错误 / 禁用 / 数字  |
| §4  | Textarea      | 基础 / 带标签计数 / 错误 / 禁用                |
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

---

## 文件变更

| 操作 | 文件                                      |
| ---- | ----------------------------------------- |
| 新建 | `src/views/DemoPage.vue`                  |
| 修改 | `src/router/index.ts` — 添加 `/demo` 路由 |

## 验证

- `npm run build` 零错误
- `npm run dev` 浏览器访问 `/#/demo`，17 个组件全部渲染正常
