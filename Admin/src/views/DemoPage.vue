<script setup lang="ts">
import { ref, h } from 'vue'
import { Icon } from '@iconify/vue'
import { createLogger } from '@/utils/logger'
import {
  Button,
  IconContainer,
  Input,
  Textarea,
  Select,
  Switch,
  Tooltip,
  Popover,
  DropdownMenu,
  ContextMenu,
  Dialog,
  Confirm,
  toast,
  Tabs,
  ScrollArea,
  EmptyState,
  Skeleton,
  Accordion,
  AlertDialog,
  AspectRatio,
  Breadcrumb,
  Calendar,
  Cascader,
  Checkbox,
  Collapsible,
  Combobox,
  CommandPalette,
  DatePicker,
  Drawer,
  HoverCard,
  Label,
  Menubar,
  NavigationMenu,
  Progress,
  RadioGroup,
  Rating,
  SegmentedControl,
  Separator,
  Slider,
  Stepper,
  Toggle,
  Toolbar,
  TreeSelect,
  VisuallyHidden,
} from '@/components/common'
import type { MenuItem, SelectOption, TabItem } from '@/components/common/types'
import { getIcon } from '@/icons'

const log = createLogger('DemoPage.vue', 'DemoPage')

// ---- 演示状态 ----
const inputValue = ref('')
const inputErrorValue = ref('错误内容')
const textareaValue = ref('')
const selectValue = ref('')
const switchOn = ref(false)
const dialogOpen = ref(false)
const confirmDefaultOpen = ref(false)
const confirmDangerOpen = ref(false)
const confirmExtraOpen = ref(false)
const activeTabLog = ref('tab-1')
const checkboxChecked = ref(false)
const radioValue = ref('option-1')
const sliderValue = ref([40])
const togglePressed = ref(false)
const segmentValue = ref('list')
const ratingValue = ref(3)
const comboboxValue = ref('apple')
const commandOpen = ref(false)
const stepperCurrent = ref(0)
const dateValue = ref<Date | undefined>(undefined)
const treeValue = ref('frontend-react')
const cascaderValue = ref<string[]>([])

// ---- Select / Combobox 共用水果选项 ----
const fruitOptions: SelectOption[] = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃' },
  { value: 'durian', label: '榴莲（不可选）', disabled: true },
  { value: 'grape', label: '葡萄' },
]

const comboboxOptions = fruitOptions.filter((item) => !item.disabled)

// ---- DropdownMenu 菜单项 ----
const dropdownItems: MenuItem[] = [
  {
    label: '编辑',
    icon: h(IconContainer, { size: 14 }, () =>
      h(Icon, { icon: getIcon('edit'), width: 14 }),
    ),
    shortcut: '⌘E',
    onClick: () => toast('点击了编辑', 'info'),
  },
  {
    label: '复制',
    icon: h(IconContainer, { size: 14 }, () =>
      h(Icon, { icon: getIcon('copy'), width: 14 }),
    ),
    shortcut: '⌘C',
    onClick: () => toast('已复制', 'success'),
  },
  {
    label: '刷新',
    icon: h(IconContainer, { size: 14 }, () =>
      h(Icon, { icon: getIcon('refresh'), width: 14 }),
    ),
    onClick: () => toast('已刷新', 'success'),
  },
  { label: '', separator: true },
  {
    label: '删除',
    icon: h(IconContainer, { size: 14 }, () =>
      h(Icon, { icon: getIcon('trash'), width: 14 }),
    ),
    danger: true,
    onClick: () => toast('删除操作需确认', 'warn'),
  },
]

// ---- ContextMenu 菜单项 ----
const contextMenuItems: MenuItem[] = [
  {
    label: '查看详情',
    icon: h(IconContainer, { size: 14 }, () =>
      h(Icon, { icon: getIcon('info'), width: 14 }),
    ),
    onClick: () => toast('查看详情', 'info'),
  },
  {
    label: '复制文本',
    icon: h(IconContainer, { size: 14 }, () =>
      h(Icon, { icon: getIcon('copy'), width: 14 }),
    ),
    shortcut: '⌘C',
    onClick: () => toast('已复制', 'success'),
  },
  { label: '', separator: true },
  {
    label: '删除',
    icon: h(IconContainer, { size: 14 }, () =>
      h(Icon, { icon: getIcon('trash'), width: 14 }),
    ),
    danger: true,
    onClick: () => toast('已删除', 'error'),
  },
]

// ---- Tabs ----
const demoTabs: TabItem[] = [
  {
    id: 'tab-1',
    label: '概览',
    icon: h(IconContainer, { size: 14 }, () =>
      h(Icon, { icon: getIcon('home'), width: 14 }),
    ),
    content: h(
      'p',
      { style: { color: 'var(--text)', fontSize: 'var(--text-base)' } },
      '这是概览标签页的内容。',
    ),
  },
  {
    id: 'tab-2',
    label: '设置',
    icon: h(IconContainer, { size: 14 }, () =>
      h(Icon, { icon: getIcon('settingsGear'), width: 14 }),
    ),
    content: h(
      'p',
      { style: { color: 'var(--text)', fontSize: 'var(--text-base)' } },
      '这是设置标签页的内容。',
    ),
  },
  {
    id: 'tab-3',
    label: '通知',
    icon: h(IconContainer, { size: 14 }, () =>
      h(Icon, { icon: getIcon('bell'), width: 14 }),
    ),
    content: h(
      'p',
      { style: { color: 'var(--text)', fontSize: 'var(--text-base)' } },
      '这是通知标签页的内容。',
    ),
  },
]

// ---- ScrollArea 示例长文本 ----
const scrollLines = Array.from({ length: 20 }, (_, i) => i + 1)

// ---- DropdownMenu trigger VNodes ----
const dropdownTriggerFull = h(
  Button,
  { variant: 'secondary' },
  () => '打开菜单',
)
const dropdownTriggerPlain = h(Button, { variant: 'subtle' }, () => '简单菜单')

// ---- Accordion ----
const accordionSingleItems = [
  {
    value: 'acc-1',
    trigger: '基础说明',
    content: '这里是 Accordion 第一项内容。',
  },
  {
    value: 'acc-2',
    trigger: '使用场景',
    content: '适合设置分组、FAQ、折叠详情等场景。',
  },
  {
    value: 'acc-3',
    trigger: '禁用项',
    disabled: true,
    content: '这一项当前不可展开。',
  },
]

const accordionMultipleItems = [
  { value: 'multi-1', trigger: '第一项', content: '可以同时展开多项。' },
  { value: 'multi-2', trigger: '第二项', content: '这一项也保持独立开关。' },
]
// ---- Menubar ----
const menubarMenus = [
  {
    label: '文件',
    items: [
      { label: '新建', onClick: () => toast('新建文件', 'info') },
      { label: '打开', onClick: () => toast('打开文件', 'info') },
      { label: '', separator: true as const },
      { label: '退出', danger: true, onClick: () => toast('退出菜单', 'warn') },
    ],
  },
  {
    label: '编辑',
    items: [
      { label: '复制', onClick: () => toast('复制', 'success') },
      { label: '剪切', onClick: () => toast('剪切', 'success') },
    ],
  },
  {
    label: '帮助',
    content: h(
      'div',
      { style: { color: 'var(--muted)', fontSize: 'var(--text-sm)' } },
      '帮助面板内容',
    ),
  },
]

// ---- NavigationMenu ----
const navigationItems = [
  { label: '首页', onClick: () => toast('进入首页', 'info') },
  {
    label: '工具',
    content: h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-sm)',
        },
      },
      [
        h(
          Button,
          { variant: 'subtle', onClick: () => toast('音频转码', 'info') },
          () => '音频转码',
        ),
        h(
          Button,
          { variant: 'subtle', onClick: () => toast('图片转码', 'info') },
          () => '图片转码',
        ),
      ],
    ),
  },
  { label: '关于', onClick: () => toast('关于 Pancake', 'info') },
]

// ---- RadioGroup ----
const radioOptions = [
  { value: 'option-1', label: '跟随系统' },
  { value: 'option-2', label: '深色' },
  { value: 'option-3', label: '浅色' },
]

// ---- SegmentedControl ----
const segmentOptions = [
  { value: 'list', label: '列表' },
  { value: 'grid', label: '网格' },
  { value: 'detail', label: '详情' },
]

// ---- Breadcrumb ----
const breadcrumbItems = [
  { label: '首页', onClick: () => toast('返回首页', 'info') },
  { label: '工具', onClick: () => toast('进入工具', 'info') },
  { label: '图片转换' },
]

// ---- CommandPalette ----
const commandItems = [
  {
    id: 'home',
    label: '回到首页',
    keywords: 'home',
    onSelect: () => toast('回到首页', 'info'),
  },
  {
    id: 'audio',
    label: '音频转码',
    keywords: 'audio',
    onSelect: () => toast('打开音频转码', 'info'),
  },
  {
    id: 'picture',
    label: '图片转码',
    keywords: 'picture',
    onSelect: () => toast('打开图片转码', 'info'),
  },
]

// ---- Stepper ----
const stepperSteps = [
  { title: '填写信息', description: '基本资料' },
  { title: '确认内容', description: '二次确认' },
  { title: '完成', description: '提交成功' },
]

function handleStepperChange(index: number) {
  // 由 Stepper 点击已到达步骤时回传的目标下标
  stepperCurrent.value = index
}

// ---- TreeSelect ----
const treeOptions = [
  {
    value: 'frontend',
    label: '前端',
    children: [
      {
        value: 'frontend-react',
        label: 'React',
        children: [
          { value: 'frontend-react-hooks', label: 'Hooks' },
          { value: 'frontend-react-router', label: 'Router' },
        ],
      },
      { value: 'frontend-vue', label: 'Vue' },
    ],
  },
  {
    value: 'backend',
    label: '后端',
    children: [
      { value: 'backend-python', label: 'Python' },
      { value: 'backend-rust', label: 'Rust' },
    ],
  },
]

// ---- Cascader ----
const cascaderOptions = [
  {
    value: 'china',
    label: '中国',
    children: [
      {
        value: 'guangdong',
        label: '广东',
        children: [
          { value: 'guangzhou', label: '广州' },
          { value: 'shenzhen', label: '深圳' },
        ],
      },
      {
        value: 'zhejiang',
        label: '浙江',
        children: [{ value: 'hangzhou', label: '杭州' }],
      },
    ],
  },
  {
    value: 'japan',
    label: '日本',
    children: [{ value: 'tokyo', label: '东京' }],
  },
]

log.info('进入Demo页')
</script>

<template>
  <div class="demoPage">
    <div class="header">
      <h1 class="title">Common 组件示例</h1>
      <p class="subtitle">共 44 个基础组件，一一展示常规用法</p>
    </div>

    <section id="button" class="section">
      <h2 class="sectionTitle">§1 Button</h2>
      <p class="sectionDesc">
        封装 loading 态的原子按钮，样式来自全局 .btn.* 类。
      </p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">变体</span>
          <Button variant="primary">主按钮</Button>
          <Button variant="secondary">次要按钮</Button>
          <Button variant="subtle">低调按钮</Button>
          <Button variant="danger">危险按钮</Button>
        </div>
        <div class="row">
          <span class="label">带图标</span>
          <Button variant="primary"
            ><template #icon
              ><IconContainer :size="14"
                ><Icon
                  :icon="getIcon('add')"
                  :width="14" /></IconContainer></template
            >新建</Button
          >
          <Button variant="secondary"
            ><template #icon
              ><IconContainer :size="14"
                ><Icon
                  :icon="getIcon('search')"
                  :width="14" /></IconContainer></template
            >搜索</Button
          >
          <Button variant="subtle"
            ><template #icon
              ><IconContainer :size="14"
                ><Icon
                  :icon="getIcon('edit')"
                  :width="14" /></IconContainer></template
            >编辑</Button
          >
          <Button variant="danger"
            ><template #icon
              ><IconContainer :size="14"
                ><Icon
                  :icon="getIcon('trash')"
                  :width="14" /></IconContainer></template
            >删除</Button
          >
        </div>
        <div class="row">
          <span class="label">Loading</span>
          <Button variant="primary" loading>提交中</Button>
          <Button variant="primary" loading loading-text="保存中..."
            >保存</Button
          >
        </div>
        <div class="row">
          <span class="label">禁用</span>
          <Button variant="primary" disabled>禁用主按钮</Button>
          <Button variant="secondary" disabled>禁用次要按钮</Button>
          <Button variant="subtle" disabled>禁用低调按钮</Button>
        </div>
        <div class="row">
          <span class="label">全宽</span>
          <Button variant="subtle" block>全宽列表项</Button>
        </div>
      </div>
    </section>

    <section id="iconContainer" class="section">
      <h2 class="sectionTitle">§2 IconContainer</h2>
      <p class="sectionDesc">统一图片/图标容器，固定尺寸居中裁剪。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">圆角方形</span>
          <IconContainer
            :size="48"
            shape="rounded"
            src="https://github.com/fluidicon.png"
            alt="GitHub"
          />
          <IconContainer
            :size="64"
            shape="rounded"
            src="https://github.com/fluidicon.png"
            alt="GitHub"
          />
          <IconContainer
            :size="80"
            shape="rounded"
            src="https://github.com/fluidicon.png"
            alt="GitHub"
          />
        </div>
        <div class="row">
          <span class="label">圆形</span>
          <IconContainer
            :size="48"
            shape="circle"
            src="https://github.com/fluidicon.png"
            alt="GitHub"
          />
          <IconContainer
            :size="64"
            shape="circle"
            src="https://github.com/fluidicon.png"
            alt="GitHub"
          />
          <IconContainer
            :size="80"
            shape="circle"
            src="https://github.com/fluidicon.png"
            alt="GitHub"
          />
        </div>
        <div class="row">
          <span class="label">ReactNode 图标</span>
          <IconContainer :size="40" shape="rounded"
            ><Icon :icon="getIcon('github')" :width="22"
          /></IconContainer>
          <IconContainer :size="40" shape="circle"
            ><Icon :icon="getIcon('home')" :width="20"
          /></IconContainer>
          <IconContainer :size="40" shape="rounded"
            ><Icon :icon="getIcon('person')" :width="22"
          /></IconContainer>
        </div>
        <div class="row">
          <span class="label">加载失败 fallback</span>
          <IconContainer
            :size="48"
            shape="rounded"
            src="/nonexistent.png"
            alt="不存在的图片"
          />
          <IconContainer
            :size="48"
            shape="circle"
            src="/nonexistent.png"
            alt="不存在的图片"
          >
            <template #fallback
              ><Icon :icon="getIcon('error')" :width="22"
            /></template>
          </IconContainer>
        </div>
      </div>
    </section>

    <section id="input" class="section">
      <h2 class="sectionTitle">§3 Input</h2>
      <p class="sectionDesc">
        单行文本输入，支持 label / helper / error 状态。
      </p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">基础</span>
          <Input
            v-model="inputValue"
            placeholder="请输入内容..."
            class="w260"
          />
        </div>
        <div class="row">
          <span class="label">带标签</span>
          <Input
            v-model="inputValue"
            label="用户名"
            placeholder="请输入用户名"
            class="w260"
          />
        </div>
        <div class="row">
          <span class="label">辅助说明</span>
          <Input
            v-model="inputValue"
            label="邮箱"
            helper="请输入有效的邮箱地址"
            placeholder="example@mail.com"
            class="w260"
          />
        </div>
        <div class="row">
          <span class="label">错误状态</span>
          <Input
            v-model="inputErrorValue"
            label="密码"
            error="密码长度不能少于 8 位"
            type="password"
            class="w260"
          />
        </div>
        <div class="row">
          <span class="label">禁用</span>
          <Input model-value="不可编辑" disabled class="w260" />
        </div>
        <div class="row">
          <span class="label">数字</span>
          <Input model-value="42" label="数量" type="number" class="w160" />
        </div>
      </div>
    </section>

    <section id="textarea" class="section">
      <h2 class="sectionTitle">§4 Textarea</h2>
      <p class="sectionDesc">多行文本输入，复用 Input 的 Token 体系。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">基础</span>
          <Textarea
            v-model="textareaValue"
            placeholder="请输入多行文本..."
            class="w320"
          />
        </div>
        <div class="row">
          <span class="label">带标签 + 计数</span>
          <Textarea
            v-model="textareaValue"
            label="简介"
            :helper="`${textareaValue.length} / 200`"
            :max-length="200"
            :rows="4"
            placeholder="请填写简介，最多 200 字"
            class="w320"
          />
        </div>
        <div class="row">
          <span class="label">错误状态</span>
          <Textarea
            model-value=""
            label="必填项"
            error="此字段为必填项"
            placeholder="请输入..."
            class="w320"
          />
        </div>
        <div class="row">
          <span class="label">禁用</span>
          <Textarea
            model-value="这是一段只读的文本内容。"
            disabled
            class="w320"
          />
        </div>
      </div>
    </section>

    <section id="select" class="section">
      <h2 class="sectionTitle">§5 Select</h2>
      <p class="sectionDesc">
        下拉选择器，Radix Select 骨架 + .glass 面板 Token。
      </p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">基础</span>
          <Select
            v-model="selectValue"
            :options="fruitOptions"
            placeholder="请选择水果..."
          />
        </div>
        <div class="row">
          <span class="label">带标签</span>
          <Select
            v-model="selectValue"
            :options="fruitOptions"
            label="水果"
            placeholder="请选择..."
          />
        </div>
        <div class="row">
          <span class="label">已选中</span>
          <Select
            model-value="apple"
            :options="fruitOptions"
            label="已选水果"
          />
        </div>
        <div class="row">
          <span class="label">禁用</span>
          <Select
            model-value=""
            :options="fruitOptions"
            placeholder="不可用"
            disabled
          />
        </div>
      </div>
    </section>

    <section id="switch" class="section">
      <h2 class="sectionTitle">§6 Switch</h2>
      <p class="sectionDesc">布尔值开关，Radix Switch 骨架。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">基础</span>
          <Switch v-model="switchOn" />
        </div>
        <div class="row">
          <span class="label">带标签</span>
          <Switch v-model="switchOn" :label="switchOn ? '已开启' : '已关闭'" />
        </div>
        <div class="row">
          <span class="label">开启态</span>
          <Switch :model-value="true" label="通知开关" />
        </div>
        <div class="row">
          <span class="label">禁用</span>
          <Switch :model-value="false" label="不可操作" disabled />
          <Switch :model-value="true" disabled />
        </div>
      </div>
    </section>

    <section id="tooltip" class="section">
      <h2 class="sectionTitle">§7 Tooltip</h2>
      <p class="sectionDesc">悬停提示，仅文字，深色固定不随主题变化。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">上（默认）</span>
          <Tooltip content="这是上方弹出的提示文字"
            ><Button variant="subtle">悬停看提示（上）</Button></Tooltip
          >
        </div>
        <div class="row">
          <span class="label">四个方向</span>
          <Tooltip content="上方提示" side="top"
            ><Button variant="subtle">上</Button></Tooltip
          >
          <Tooltip content="右侧提示" side="right"
            ><Button variant="subtle">右</Button></Tooltip
          >
          <Tooltip content="下方提示" side="bottom"
            ><Button variant="subtle">下</Button></Tooltip
          >
          <Tooltip content="左侧提示" side="left"
            ><Button variant="subtle">左</Button></Tooltip
          >
        </div>
        <div class="row">
          <span class="label">长延迟</span>
          <Tooltip content="悬停 1 秒后才出现" :delay-duration="1000"
            ><Button variant="subtle">悬停 1s</Button></Tooltip
          >
        </div>
      </div>
    </section>

    <section id="popover" class="section">
      <h2 class="sectionTitle">§8 Popover</h2>
      <p class="sectionDesc">轻量弹出卡片，点击触发，可嵌套任意组件。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">表单卡片</span>
          <Popover side="bottom" align="start">
            <template #trigger
              ><Button variant="secondary">打开筛选面板</Button></template
            >
            <div class="popoverForm">
              <Input
                v-model="inputValue"
                label="关键字"
                placeholder="输入关键字..."
              />
              <Select
                v-model="selectValue"
                :options="fruitOptions"
                label="分类"
                placeholder="选择分类"
              />
              <Switch v-model="switchOn" label="仅显示启用项" />
              <Button
                variant="primary"
                @click="toast('筛选条件已应用', 'success')"
                >应用</Button
              >
            </div>
          </Popover>
        </div>
        <div class="row">
          <span class="label">不同对齐</span>
          <Popover side="bottom" align="start">
            <template #trigger
              ><Button variant="subtle">开头对齐</Button></template
            >
            <div class="popoverText">这是一个开头对齐的卡片</div>
          </Popover>
          <Popover side="bottom" align="center">
            <template #trigger
              ><Button variant="subtle">居中对齐</Button></template
            >
            <div class="popoverText">这是一个居中对齐的卡片</div>
          </Popover>
          <Popover side="bottom" align="end">
            <template #trigger
              ><Button variant="subtle">末尾对齐</Button></template
            >
            <div class="popoverText">这是一个末尾对齐的卡片</div>
          </Popover>
        </div>
      </div>
    </section>

    <section id="dropdownMenu" class="section">
      <h2 class="sectionTitle">§9 DropdownMenu</h2>
      <p class="sectionDesc">下拉菜单，支持图标、快捷键、分隔线、危险项。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">完整菜单</span>
          <DropdownMenu :items="dropdownItems" :trigger="dropdownTriggerFull" />
        </div>
        <div class="row">
          <span class="label">纯文字菜单</span>
          <DropdownMenu
            :items="[
              { label: '选项一', onClick: () => toast('选项一', 'info') },
              { label: '选项二', onClick: () => toast('选项二', 'info') },
              { label: '', separator: true as const },
              { label: '禁用项', disabled: true, onClick: () => {} },
            ]"
            :trigger="dropdownTriggerPlain"
          />
        </div>
      </div>
    </section>

    <section id="contextMenu" class="section">
      <h2 class="sectionTitle">§10 ContextMenu</h2>
      <p class="sectionDesc">
        右键菜单，完全复用 DropdownMenu 的 MenuItem 结构和样式。
      </p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">右键区域</span>
          <ContextMenu :items="contextMenuItems">
            <div class="contextArea contextCursor">
              在此区域右键点击查看菜单
            </div>
          </ContextMenu>
        </div>
        <div class="row">
          <span class="label">禁用右键</span>
          <ContextMenu :items="contextMenuItems" disabled>
            <div class="contextArea">此区域右键菜单已禁用</div>
          </ContextMenu>
        </div>
      </div>
    </section>

    <section id="dialog" class="section">
      <h2 class="sectionTitle">§11 Dialog</h2>
      <p class="sectionDesc">
        通用弹窗，遮罩层模糊背景，内部可自由组合任意下层组件。
      </p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">Trigger 触发</span>
          <Dialog title="用户信息" description="请填写以下信息">
            <template #trigger
              ><Button variant="primary">打开弹窗（Trigger）</Button></template
            >
            <div class="sectionBody">
              <Input
                v-model="inputValue"
                label="姓名"
                placeholder="请输入姓名"
              />
              <Select
                v-model="selectValue"
                :options="fruitOptions"
                label="偏好水果"
                placeholder="请选择"
              />
            </div>
          </Dialog>
        </div>
        <div class="row">
          <span class="label">外部受控</span>
          <Button variant="secondary" @click="dialogOpen = true"
            >打开弹窗（受控）</Button
          >
          <Dialog
            :open="dialogOpen"
            title="提示"
            description="这是一个外部状态控制的弹窗"
            @update:open="dialogOpen = $event"
          >
            <p class="textSm">弹窗内容区域，可以放置任意组件。</p>
          </Dialog>
        </div>
        <div class="row">
          <span class="label">无 description</span>
          <Dialog title="简洁标题">
            <template #trigger
              ><Button variant="subtle">简洁弹窗</Button></template
            >
            <p class="textSm">没有 description 的简洁弹窗。</p>
          </Dialog>
        </div>
      </div>
    </section>

    <section id="confirm" class="section">
      <h2 class="sectionTitle">§12 Confirm</h2>
      <p class="sectionDesc">
        Dialog 的预设子集，预置按钮槽位 [取消] [...额外按钮] [确认]。
      </p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">默认确认</span>
          <Button variant="secondary" @click="confirmDefaultOpen = true"
            >删除文件确认</Button
          >
          <Confirm
            :open="confirmDefaultOpen"
            title="确认删除"
            description="此操作将删除所选文件，删除后可在回收站恢复。"
            @update:open="confirmDefaultOpen = $event"
            @confirm="toast('文件已删除', 'success')"
          >
            <p class="textSm">确定要删除选中的 3 个文件吗？</p>
          </Confirm>
        </div>
        <div class="row">
          <span class="label">危险确认</span>
          <Button variant="danger" @click="confirmDangerOpen = true"
            >永久删除</Button
          >
          <Confirm
            :open="confirmDangerOpen"
            title="永久删除"
            description="此操作不可撤销，数据将永久丢失。"
            variant="danger"
            confirm-label="永久删除"
            cancel-label="我再想想"
            @update:open="confirmDangerOpen = $event"
            @confirm="toast('数据已永久删除', 'error')"
          />
        </div>
        <div class="row">
          <span class="label">额外按钮</span>
          <Button variant="secondary" @click="confirmExtraOpen = true"
            >关闭文档</Button
          >
          <Confirm
            :open="confirmExtraOpen"
            title="保存确认"
            description="文档已修改，关闭前是否保存？"
            confirm-label="保存"
            cancel-label="取消"
            :extra-buttons="[
              {
                label: '不保存',
                variant: 'subtle',
                onClick: () => toast('已放弃修改', 'info'),
              },
            ]"
            @update:open="confirmExtraOpen = $event"
            @confirm="toast('文档已保存', 'success')"
          >
            <p class="textSm">如果选择不保存，所有未保存的修改将会丢失。</p>
          </Confirm>
        </div>
      </div>
    </section>

    <section id="toast" class="section">
      <h2 class="sectionTitle">§13 Toast</h2>
      <p class="sectionDesc">
        全局消息通知，独立通知通道。点击按钮触发，Toast 从右上角滑入。
      </p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">四种变体</span>
          <Button variant="primary" @click="toast('操作成功！', 'success')"
            >Success</Button
          >
          <Button variant="danger" @click="toast('操作失败！', 'error')"
            >Error</Button
          >
          <Button
            variant="secondary"
            @click="toast('请注意此操作的影响', 'warn')"
            >Warn</Button
          >
          <Button variant="subtle" @click="toast('这是一条普通信息', 'info')"
            >Info</Button
          >
        </div>
        <div class="row">
          <span class="label">带操作按钮</span>
          <Button
            variant="subtle"
            @click="
              toast({
                message: '文件已删除',
                variant: 'success',
                duration: 5000,
                action: {
                  label: '撤销',
                  onClick: () => toast('已撤销删除', 'info'),
                },
              })
            "
            >可撤销 Toast</Button
          >
        </div>
        <div class="row">
          <span class="label">纯字符串调用</span>
          <Button
            variant="subtle"
            @click="toast('你好，这是一条快捷消息', 'info')"
            >快捷 Toast</Button
          >
        </div>
      </div>
    </section>

    <section id="tabs" class="section">
      <h2 class="sectionTitle">§14 Tabs</h2>
      <p class="sectionDesc">标签页切换容器，Radix Tabs 骨架。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">带图标（当前: {{ activeTabLog }}）</span>
          <div class="w100">
            <Tabs
              :tabs="demoTabs"
              default-tab="tab-1"
              @change="
                (id: string) => {
                  activeTabLog = id
                  log.info(`切换至标签: ${id}`)
                }
              "
            />
          </div>
        </div>
        <div class="row">
          <span class="label">纯文字</span>
          <div class="w100">
            <Tabs
              :tabs="[
                {
                  id: 'a',
                  label: '标签A',
                  content: h(
                    'span',
                    { style: { color: 'var(--text)' } },
                    '内容 A',
                  ),
                },
                {
                  id: 'b',
                  label: '标签B',
                  content: h(
                    'span',
                    { style: { color: 'var(--text)' } },
                    '内容 B',
                  ),
                },
                {
                  id: 'c',
                  label: '标签C',
                  content: h(
                    'span',
                    { style: { color: 'var(--text)' } },
                    '内容 C',
                  ),
                },
              ]"
              default-tab="a"
            />
          </div>
        </div>
      </div>
    </section>

    <section id="scrollArea" class="section">
      <h2 class="sectionTitle">§15 ScrollArea</h2>
      <p class="sectionDesc">统一样式的滚动容器，替换原生滚动条。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">固定高度滚动</span>
          <div class="box400">
            <ScrollArea :max-height="160">
              <div class="scrollPadding">
                <p v-for="i in scrollLines" :key="i" class="scrollLine">
                  第 {{ i }} 行：这是一段用于演示滚动区域的示例文本内容。
                </p>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </section>

    <section id="emptyState" class="section">
      <h2 class="sectionTitle">§16 EmptyState</h2>
      <p class="sectionDesc">空状态占位，列表无数据时显示。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">默认</span>
          <div class="box400">
            <EmptyState title="暂无数据" description="稍后再来看看吧" />
          </div>
        </div>
        <div class="row">
          <span class="label">带操作按钮</span>
          <div class="box400">
            <EmptyState title="还没有收藏" description="收藏的内容会显示在这里">
              <template #action>
                <Button variant="primary" @click="toast('去发现内容', 'info')">
                  <template #icon
                    ><IconContainer :size="14"
                      ><Icon
                        :icon="getIcon('add')"
                        :width="14" /></IconContainer
                  ></template>
                  去发现
                </Button>
              </template>
            </EmptyState>
          </div>
        </div>
        <div class="row">
          <span class="label">自定义图标</span>
          <div class="box400">
            <EmptyState title="无搜索结果" description="换个关键词试试">
              <template #icon
                ><IconContainer :size="48"
                  ><Icon :icon="getIcon('search')" :width="48" /></IconContainer
              ></template>
            </EmptyState>
          </div>
        </div>
      </div>
    </section>

    <section id="skeleton" class="section">
      <h2 class="sectionTitle">§17 Skeleton</h2>
      <p class="sectionDesc">骨架屏，内容加载中的占位动画。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">文本</span>
          <div class="w300"><Skeleton variant="text" /></div>
        </div>
        <div class="row">
          <span class="label">段落（5行）</span>
          <div class="w320"><Skeleton variant="text" :count="5" /></div>
        </div>
        <div class="row">
          <span class="label">圆形</span>
          <Skeleton variant="circle" :width="48" :height="48" />
          <Skeleton variant="circle" :width="32" :height="32" />
          <Skeleton variant="circle" :width="24" :height="24" />
        </div>
        <div class="row">
          <span class="label">矩形</span>
          <Skeleton variant="rect" :width="200" :height="120" />
          <Skeleton variant="rect" width="100%" :height="40" />
        </div>
      </div>
    </section>

    <section id="accordion" class="section">
      <h2 class="sectionTitle">§18 Accordion</h2>
      <p class="sectionDesc">手风琴折叠面板，支持单项与多项展开。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">单项手风琴</span>
          <div class="box420"><Accordion :items="accordionSingleItems" /></div>
        </div>
        <div class="row">
          <span class="label">多项手风琴</span>
          <div class="box420">
            <Accordion type="multiple" :items="accordionMultipleItems" />
          </div>
        </div>
      </div>
    </section>

    <section id="alertDialog" class="section">
      <h2 class="sectionTitle">§19 AlertDialog</h2>
      <p class="sectionDesc">AlertDialog — 需要明确确认的关键操作弹窗。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">危险确认</span>
          <AlertDialog
            title="永久删除文件？"
            description="此操作不可撤销。"
            cancel-label="再想想"
            action-label="永久删除"
            @action="toast('文件已永久删除', 'error')"
          >
            <template #trigger
              ><Button variant="danger">永久删除</Button></template
            >
            <span>删除后无法恢复，请确认是否继续。</span>
          </AlertDialog>
        </div>
        <div class="row">
          <span class="label">普通确认</span>
          <AlertDialog
            title="退出登录"
            description="退出后需要重新验证身份。"
            @action="toast('已退出登录', 'success')"
          >
            <template #trigger
              ><Button variant="secondary">退出登录</Button></template
            >
          </AlertDialog>
        </div>
      </div>
    </section>

    <section id="aspectRatio" class="section">
      <h2 class="sectionTitle">§20 AspectRatio</h2>
      <p class="sectionDesc">固定宽高比容器，适合图片、视频等媒体内容。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">16:9</span>
          <div class="w260">
            <AspectRatio :ratio="16 / 9"
              ><div class="aspectFill">16:9</div></AspectRatio
            >
          </div>
        </div>
        <div class="row">
          <span class="label">1:1</span>
          <div class="w120">
            <AspectRatio :ratio="1"
              ><div class="aspectFill">1:1</div></AspectRatio
            >
          </div>
        </div>
      </div>
    </section>

    <section id="checkbox" class="section">
      <h2 class="sectionTitle">§21 Checkbox</h2>
      <p class="sectionDesc">复选框，支持受控勾选与禁用态。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">受控</span>
          <Checkbox
            v-model="checkboxChecked"
            :label="checkboxChecked ? '已勾选' : '未勾选'"
          />
        </div>
        <div class="row">
          <span class="label">禁用</span>
          <Checkbox :model-value="false" label="不可操作" disabled />
          <Checkbox :model-value="true" disabled />
        </div>
      </div>
    </section>

    <section id="collapsible" class="section">
      <h2 class="sectionTitle">§22 Collapsible</h2>
      <p class="sectionDesc">可展开/收起的折叠内容区。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">展开详情</span>
          <div class="box420">
            <Collapsible>
              <template #trigger>查看高级设置</template>
              <div class="sectionBody">
                <Checkbox v-model="checkboxChecked" label="启用实验功能" />
                <Button variant="subtle" @click="toast('设置已保存', 'success')"
                  >保存设置</Button
                >
              </div>
            </Collapsible>
          </div>
        </div>
      </div>
    </section>

    <section id="hoverCard" class="section">
      <h2 class="sectionTitle">§23 HoverCard</h2>
      <p class="sectionDesc">鼠标悬停后弹出的信息卡片。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">悬停查看</span>
          <HoverCard>
            <template #trigger
              ><Button variant="subtle">悬停查看用户</Button></template
            >
            <div class="hoverCardContent">
              <IconContainer
                :size="40"
                shape="circle"
                src="https://github.com/fluidicon.png"
                alt="GitHub"
              />
              <div class="columnFlex">
                <span class="hoverName">Pancake</span>
                <span class="textMutedXs">悬停卡片示例</span>
              </div>
            </div>
          </HoverCard>
        </div>
      </div>
    </section>

    <section id="label" class="section">
      <h2 class="sectionTitle">§24 Label</h2>
      <p class="sectionDesc">表单标签，点击可聚焦关联控件。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">Label + Input</span>
          <div class="labelColumn">
            <Label html-for="demo-label-input">昵称</Label>
            <Input
              id="demo-label-input"
              v-model="inputValue"
              placeholder="请输入昵称"
              class="w220"
            />
          </div>
        </div>
      </div>
    </section>

    <section id="menubar" class="section">
      <h2 class="sectionTitle">§25 Menubar</h2>
      <p class="sectionDesc">桌面风格顶部菜单栏。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">菜单栏</span>
          <Menubar :menus="menubarMenus" />
        </div>
      </div>
    </section>

    <section id="navigationMenu" class="section">
      <h2 class="sectionTitle">§26 NavigationMenu</h2>
      <p class="sectionDesc">导航菜单，支持普通链接与展开面板。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">导航示例</span>
          <NavigationMenu :items="navigationItems" />
        </div>
      </div>
    </section>

    <section id="progress" class="section">
      <h2 class="sectionTitle">§27 Progress</h2>
      <p class="sectionDesc">进度条，展示任务完成度。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">普通进度</span>
          <div class="box320"><Progress :value="65" /></div>
        </div>
        <div class="row">
          <span class="label">接近完成</span>
          <div class="box320"><Progress :value="92" /></div>
        </div>
      </div>
    </section>

    <section id="radioGroup" class="section">
      <h2 class="sectionTitle">§28 RadioGroup</h2>
      <p class="sectionDesc">单选组，键盘方向键可切换选项。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">单选</span>
          <RadioGroup
            v-model="radioValue"
            label="偏好主题"
            :options="radioOptions"
          />
        </div>
      </div>
    </section>

    <section id="separator" class="section">
      <h2 class="sectionTitle">§29 Separator</h2>
      <p class="sectionDesc">横向或纵向视觉分隔线。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">横向</span>
          <div class="w200"><Separator /></div>
        </div>
        <div class="row">
          <span class="label">纵向</span>
          <div class="separatorVerticalWrap">
            <Separator orientation="vertical" />
          </div>
        </div>
      </div>
    </section>

    <section id="slider" class="section">
      <h2 class="sectionTitle">§30 Slider</h2>
      <p class="sectionDesc">滑块，适合音量、亮度、数值范围等场景。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">受控滑块</span>
          <div class="box320">
            <Slider v-model="sliderValue" label="数值" :min="0" :max="100" />
            <span class="textMutedXs"
              >当前值：{{ sliderValue.join(', ') }}</span
            >
          </div>
        </div>
      </div>
    </section>

    <section id="toggle" class="section">
      <h2 class="sectionTitle">§31 Toggle</h2>
      <p class="sectionDesc">按压态按钮，适合图标开关。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">按压开关</span>
          <Toggle v-model:pressed="togglePressed" aria-label="切换通知">
            <IconContainer :size="16"
              ><Icon :icon="getIcon('bell')" :width="16"
            /></IconContainer>
          </Toggle>
          <span class="textMutedSm">{{
            togglePressed ? '已开启' : '已关闭'
          }}</span>
        </div>
        <div class="row">
          <span class="label">禁用</span>
          <Toggle disabled aria-label="禁用切换">
            <IconContainer :size="16"
              ><Icon :icon="getIcon('bell')" :width="16"
            /></IconContainer>
          </Toggle>
        </div>
      </div>
    </section>

    <section id="visuallyHidden" class="section">
      <h2 class="sectionTitle">§32 VisuallyHidden</h2>
      <p class="sectionDesc">视觉隐藏但保留给读屏器访问的内容。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">读屏专用文本</span>
          <span class="textMutedSm">下面内容只对读屏器可见：</span>
          <VisuallyHidden
            >这是一段屏幕阅读器可访问但页面不可见的文本。</VisuallyHidden
          >
        </div>
      </div>
    </section>

    <section id="drawer" class="section">
      <h2 class="sectionTitle">§33 Drawer</h2>
      <p class="sectionDesc">从屏幕边缘滑出的抽屉面板，基于 Radix Dialog。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">右侧抽屉</span>
          <Drawer title="设置" side="right">
            <template #trigger
              ><Button variant="secondary">打开设置抽屉</Button></template
            >
            <p class="drawerText">这里可以放设置表单、详情内容等。</p>
          </Drawer>
        </div>
      </div>
    </section>

    <section id="segmentedControl" class="section">
      <h2 class="sectionTitle">§34 SegmentedControl</h2>
      <p class="sectionDesc">分段选择器，基于 Radix RadioGroup。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">视图切换</span>
          <SegmentedControl v-model="segmentValue" :options="segmentOptions" />
        </div>
        <div class="row">
          <span class="label">当前值</span>
          <span class="textMutedSm">{{ segmentValue }}</span>
        </div>
      </div>
    </section>

    <section id="rating" class="section">
      <h2 class="sectionTitle">§35 Rating</h2>
      <p class="sectionDesc">星级评分，支持键盘方向键。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">评分</span>
          <Rating v-model="ratingValue" />
        </div>
        <div class="row">
          <span class="label">当前分数</span>
          <span class="textMutedSm">{{ ratingValue }} / 5</span>
        </div>
      </div>
    </section>

    <section id="breadcrumb" class="section">
      <h2 class="sectionTitle">§36 Breadcrumb</h2>
      <p class="sectionDesc">面包屑导航，最后一项为当前页。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">导航路径</span>
          <Breadcrumb :items="breadcrumbItems" />
        </div>
      </div>
    </section>

    <section id="combobox" class="section">
      <h2 class="sectionTitle">§37 Combobox</h2>
      <p class="sectionDesc">可输入过滤的下拉选择，基于 Radix Popover。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">水果选择</span>
          <div class="w240">
            <Combobox
              v-model="comboboxValue"
              :options="comboboxOptions"
              placeholder="输入或选择水果"
            />
          </div>
        </div>
        <div class="row">
          <span class="label">当前值</span>
          <span class="textMutedSm">{{ comboboxValue }}</span>
        </div>
      </div>
    </section>

    <section id="commandPalette" class="section">
      <h2 class="sectionTitle">§38 CommandPalette</h2>
      <p class="sectionDesc">命令面板，支持过滤与键盘操作。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">打开命令面板</span>
          <Button variant="secondary" @click="commandOpen = true"
            >打开命令面板</Button
          >
          <CommandPalette v-model:open="commandOpen" :items="commandItems" />
        </div>
      </div>
    </section>

    <section id="stepper" class="section">
      <h2 class="sectionTitle">§39 Stepper</h2>
      <p class="sectionDesc">步骤条，支持已到达步骤点击回退。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">步骤进度</span>
          <div class="box520">
            <Stepper
              :steps="stepperSteps"
              :current="stepperCurrent"
              @change="handleStepperChange"
            />
          </div>
        </div>
        <div class="row">
          <span class="label">操作</span>
          <Button
            variant="secondary"
            :disabled="stepperCurrent <= 0"
            @click="stepperCurrent = Math.max(0, stepperCurrent - 1)"
            >上一步</Button
          >
          <Button
            variant="primary"
            :disabled="stepperCurrent >= 2"
            @click="stepperCurrent = Math.min(2, stepperCurrent + 1)"
            >下一步</Button
          >
        </div>
      </div>
    </section>

    <section id="toolbar" class="section">
      <h2 class="sectionTitle">§40 Toolbar</h2>
      <p class="sectionDesc">工具条容器，内部放已封装的按钮/开关/分隔线。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">工具栏</span>
          <Toolbar>
            <Button variant="subtle" @click="toast('新建', 'info')"
              >新建</Button
            >
            <Separator orientation="vertical" />
            <Toggle v-model:pressed="togglePressed" aria-label="粗体">
              <IconContainer :size="14"
                ><Icon :icon="getIcon('bell')" :width="14"
              /></IconContainer>
            </Toggle>
            <Toggle
              :pressed="false"
              @update:pressed="() => {}"
              aria-label="斜体"
            >
              <IconContainer :size="14"
                ><Icon :icon="getIcon('search')" :width="14"
              /></IconContainer>
            </Toggle>
            <Separator orientation="vertical" />
            <Button variant="subtle" @click="toast('已保存', 'success')"
              >保存</Button
            >
          </Toolbar>
        </div>
      </div>
    </section>

    <section id="calendar" class="section">
      <h2 class="sectionTitle">§41 Calendar</h2>
      <p class="sectionDesc">日历面板，可直接嵌入页面或配合 DatePicker。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">选择日期</span>
          <Calendar v-model="dateValue" />
        </div>
      </div>
    </section>

    <section id="datePicker" class="section">
      <h2 class="sectionTitle">§42 DatePicker</h2>
      <p class="sectionDesc">日期选择，基于 Radix Popover + Calendar。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">日期选择</span>
          <DatePicker v-model="dateValue" placeholder="请选择日期" />
        </div>
      </div>
    </section>

    <section id="treeSelect" class="section">
      <h2 class="sectionTitle">§43 TreeSelect</h2>
      <p class="sectionDesc">树形选择，支持展开/折叠与叶子选择。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">选择节点</span>
          <div class="w260">
            <TreeSelect v-model="treeValue" :options="treeOptions" />
          </div>
        </div>
      </div>
    </section>

    <section id="cascader" class="section">
      <h2 class="sectionTitle">§44 Cascader</h2>
      <p class="sectionDesc">级联选择，按多列路径逐级选择。</p>
      <div class="sectionBody">
        <div class="row">
          <span class="label">选择地区</span>
          <div class="w260">
            <Cascader v-model="cascaderValue" :options="cascaderOptions" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.demoPage {
  max-width: 860px;
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  font-family: var(--font-heading);
}

.subtitle {
  margin: 0;
  margin-top: var(--spacing-sm);
  color: var(--muted);
  font-size: var(--text-sm);
}

.section {
  margin-bottom: var(--spacing-2xl);
  padding: var(--spacing-xl);
  border: 1px solid var(--glass-brd);
  border-radius: var(--radius-xl);
  background: var(--glass);
  backdrop-filter: blur(var(--blur-panel));
}

.sectionTitle {
  margin: 0;
  margin-bottom: var(--spacing-xs);
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--text);
}

.sectionDesc {
  margin: 0;
  margin-bottom: var(--spacing-lg);
  font-size: var(--text-sm);
  color: var(--muted);
}

.sectionBody {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.label {
  font-size: var(--text-sm);
  color: var(--muted);
  min-width: 80px;
}

.w100 {
  width: 100%;
}
.w120 {
  width: 120px;
}
.w160 {
  width: 160px;
}
.w200 {
  width: 200px;
}
.w220 {
  width: 220px;
}
.w240 {
  width: 240px;
}
.w260 {
  width: 260px;
}
.w280 {
  width: 280px;
}
.w300 {
  width: 300px;
}
.w320 {
  width: 320px;
}
.box320 {
  width: 100%;
  max-width: 320px;
}
.box400 {
  width: 100%;
  max-width: 400px;
}
.box420 {
  width: 100%;
  max-width: 420px;
}
.box520 {
  width: 100%;
  max-width: 520px;
}

.textBase {
  color: var(--text);
  font-size: var(--text-base);
}
.textSm {
  color: var(--text);
  font-size: var(--text-sm);
}
.textMutedSm {
  color: var(--muted);
  font-size: var(--text-sm);
}
.textMutedXs {
  color: var(--muted);
  font-size: var(--text-xs);
}
.textColor {
  color: var(--text);
}
.mutedColor {
  color: var(--muted);
}
.scrollLine {
  color: var(--text);
  font-size: var(--text-sm);
  margin: 0;
  padding: var(--spacing-sm) 0;
}

.popoverForm {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-width: 220px;
}

.popoverText {
  padding: var(--spacing-lg);
  color: var(--text);
  font-size: var(--text-sm);
}

.contextArea {
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-xl);
  border: 2px dashed var(--glass-brd);
  border-radius: var(--radius-lg);
  text-align: center;
  color: var(--muted);
  font-size: var(--text-sm);
}

.contextCursor {
  cursor: context-menu;
}

.scrollPadding {
  padding-right: var(--spacing-md);
}

.aspectFill {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass);
  color: var(--muted);
  font-size: var(--text-sm);
}

.hoverCardContent {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  min-width: 220px;
}

.columnFlex {
  display: flex;
  flex-direction: column;
}

.hoverName {
  color: var(--text);
  font-weight: 600;
}

.labelColumn {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.menuHelp {
  color: var(--muted);
  font-size: var(--text-sm);
}

.navContent {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.separatorVerticalWrap {
  height: 48px;
  display: flex;
}

.drawerText {
  margin: 0;
  color: var(--text);
}
</style>
