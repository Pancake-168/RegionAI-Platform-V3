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

// ---- 状态 ----
const inputValue = ref('')
const inputErrorValue = ref('错误内容')
const textareaValue = ref('')
const selectValue = ref('')
const switchOn = ref(false)
const dialogOpen = ref(false)
const dialogTriggerOpen = ref(false)
const dialogSimpleOpen = ref(false)
const confirmDefaultOpen = ref(false)
const confirmDangerOpen = ref(false)
const confirmExtraOpen = ref(false)
const activeTabLog = ref('tab-1')
const alertDialogOpen = ref(false)
const alertDialogTriggerOpen = ref(false)
const checkboxChecked = ref(false)
const collapsibleOpen = ref(false)
const commandOpen = ref(false)
const dateValue = ref<Date | undefined>(undefined)
const datePickerValue = ref<Date | undefined>(undefined)
const drawerOpen = ref(false)
const radioValue = ref('option-1')
const ratingValue = ref(3)
const segmentValue = ref('list')
const sliderValue = ref([40])
const stepperCurrent = ref(0)
const togglePressed = ref(false)
const comboboxValue = ref('apple')
const treeValue = ref('frontend-react')
const cascaderValue = ref<string[]>([])

// ---- Select 选项 ----
const dotIcon = (color: string) =>
  h('span', {
    style: {
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: color,
      flexShrink: '0',
    },
  })

const fruitOptions: SelectOption[] = [
  { value: 'apple', label: '苹果', icon: dotIcon('#f07178') },
  { value: 'banana', label: '香蕉', icon: dotIcon('#ffcb6b') },
  { value: 'cherry', label: '樱桃', icon: dotIcon('#c792ea') },
  {
    value: 'durian',
    label: '榴莲（不可选）',
    disabled: true,
    icon: dotIcon('#89ddff'),
  },
  { value: 'grape', label: '葡萄', icon: dotIcon('#82aaff') },
]

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

// ---- DropdownMenu trigger VNodes（h() 在 script 中创建，传给 :trigger prop） ----
const dropdownTriggerFull = h(
  Button,
  { variant: 'secondary' },
  () => '打开菜单',
)
const dropdownTriggerPlain = h(Button, { variant: 'subtle' }, () => '简单菜单')

// ---- §18 Accordion ----
const accordionItems = [
  {
    value: 'item-1',
    trigger: '什么是 RegionAI？',
    content: 'RegionAI 是一个基于 Vue 3 + Reka UI 的桌面/管理端项目。',
  },
  {
    value: 'item-2',
    trigger: '为什么使用 Reka UI？',
    content:
      'Reka UI 是 Radix UI 的 Vue 端口，可以保持基础组件逻辑与 React 版一致。',
  },
  {
    value: 'item-3',
    trigger: '如何查看完整 Demo？',
    content: '本页面按目标项目 DemoPage 的 §1～§44 顺序展示全部基础组件。',
  },
]

// ---- §25 Menubar ----
const menubarMenus = [
  {
    label: '文件',
    items: [
      { label: '新建', onClick: () => toast('新建文件', 'info') },
      { label: '打开', onClick: () => toast('打开文件', 'info') },
      { label: '', separator: true as const },
      { label: '退出', danger: true, onClick: () => toast('退出', 'error') },
    ],
  },
  {
    label: '编辑',
    items: [
      { label: '复制', onClick: () => toast('已复制', 'success') },
      { label: '粘贴', onClick: () => toast('已粘贴', 'info') },
    ],
  },
]

// ---- §26 NavigationMenu ----
const navigationItems = [
  { label: '首页', onClick: () => toast('导航到首页', 'info') },
  {
    label: '组件',
    content: h(
      'div',
      { style: { color: 'var(--text)', fontSize: 'var(--text-sm)' } },
      '这里是导航展开内容，可以放置菜单或说明。',
    ),
  },
  { label: '关于', onClick: () => toast('关于页面', 'info') },
]

// ---- §28 RadioGroup ----
const radioOptions = [
  { value: 'option-1', label: '选项一' },
  { value: 'option-2', label: '选项二' },
  { value: 'option-3', label: '选项三', disabled: true },
]

// ---- §34 SegmentedControl ----
const segmentOptions = [
  { value: 'list', label: '列表' },
  { value: 'grid', label: '网格' },
  { value: 'table', label: '表格', disabled: true },
]

// ---- §36 Breadcrumb ----
const breadcrumbItems = [
  { label: '首页', onClick: () => toast('回到首页', 'info') },
  { label: '组件', onClick: () => toast('组件列表', 'info') },
  { label: '当前页' },
]

// ---- §37 Combobox ----
const comboboxOptions = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃' },
  { value: 'grape', label: '葡萄' },
]

// ---- §38 CommandPalette ----
const commandItems = [
  {
    id: 'home',
    label: '前往首页',
    keywords: 'home 首页',
    onSelect: () => toast('前往首页', 'info'),
  },
  {
    id: 'demo',
    label: '查看 Demo',
    keywords: 'demo 示例',
    onSelect: () => toast('查看 Demo', 'info'),
  },
  {
    id: 'theme',
    label: '切换主题',
    keywords: 'theme 主题',
    onSelect: () => toast('切换主题', 'info'),
  },
]

// ---- §39 Stepper ----
const stepperSteps = [
  { title: '创建账号', description: '填写基本信息' },
  { title: '配置服务器', description: '连接 RegionAI 服务' },
  { title: '完成', description: '开始使用' },
]

// ---- §43 TreeSelect ----
const treeOptions = [
  {
    value: 'frontend',
    label: '前端',
    children: [
      { value: 'frontend-vue', label: 'Vue' },
      { value: 'frontend-react', label: 'React' },
    ],
  },
  {
    value: 'backend',
    label: '后端',
    children: [{ value: 'backend-nocobase', label: 'NocoBase' }],
  },
]

// ---- §44 Cascader ----
const cascaderOptions = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hangzhou', label: '杭州' },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [{ value: 'nanjing', label: '南京' }],
  },
]

log.info('进入Demo页')
</script>

<template>
  <div class="demo-page">
    <!-- 页面标题 -->
    <div class="demo-page-header">
      <h1 class="demo-page-title">Common 组件示例</h1>
      <p class="demo-page-subtitle">共 44 个基础组件，一一展示常规用法</p>
    </div>

    <!-- ================================================ -->
    <!-- §1 Button -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§1 Button</h2>
      <p class="demo-section-desc">
        封装 loading 态的原子按钮，样式来自全局 .btn.* 类。
      </p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">变体</span>
          <Button variant="primary">主按钮</Button>
          <Button variant="secondary">次要按钮</Button>
          <Button variant="subtle">低调按钮</Button>
          <Button variant="danger">危险按钮</Button>
        </div>
        <div class="demo-row">
          <span class="demo-label">带图标</span>
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
        <div class="demo-row">
          <span class="demo-label">Loading</span>
          <Button variant="primary" loading>提交中</Button>
          <Button variant="primary" loading loading-text="保存中..."
            >保存</Button
          >
        </div>
        <div class="demo-row">
          <span class="demo-label">禁用</span>
          <Button variant="primary" disabled>禁用主按钮</Button>
          <Button variant="secondary" disabled>禁用次要按钮</Button>
          <Button variant="subtle" disabled>禁用低调按钮</Button>
        </div>
        <div class="demo-row">
          <span class="demo-label">全宽</span>
          <Button variant="subtle" block>全宽列表项</Button>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §2 IconContainer -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§2 IconContainer</h2>
      <p class="demo-section-desc">
        统一图片/图标容器，固定尺寸居中裁剪。注意 shape
        差异在非圆形素材上更明显。
      </p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">圆角方形</span>
          <IconContainer
            :size="48"
            shape="rounded"
            src="https://picsum.photos/seed/a/100/100"
            alt="demo"
          />
          <IconContainer
            :size="64"
            shape="rounded"
            src="https://picsum.photos/seed/b/120/120"
            alt="demo"
          />
          <IconContainer
            :size="80"
            shape="rounded"
            src="https://picsum.photos/seed/c/160/160"
            alt="demo"
          />
        </div>
        <div class="demo-row">
          <span class="demo-label">圆形</span>
          <IconContainer
            :size="48"
            shape="circle"
            src="https://picsum.photos/seed/a/100/100"
            alt="demo"
          />
          <IconContainer
            :size="64"
            shape="circle"
            src="https://picsum.photos/seed/b/120/120"
            alt="demo"
          />
          <IconContainer
            :size="80"
            shape="circle"
            src="https://picsum.photos/seed/c/160/160"
            alt="demo"
          />
        </div>
        <div class="demo-row">
          <span class="demo-label">图标组件</span>
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
        <div class="demo-row">
          <span class="demo-label">加载失败</span>
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
            <template #fallback>
              <div class="demo-fallback-center">
                <Icon :icon="getIcon('error')" :width="22" />
              </div>
            </template>
          </IconContainer>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §3 Input -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§3 Input</h2>
      <p class="demo-section-desc">
        单行文本输入，支持 label / helper / error 状态。
      </p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">基础</span>
          <div class="demo-w260">
            <Input v-model="inputValue" placeholder="请输入内容..." />
          </div>
        </div>
        <div class="demo-row">
          <span class="demo-label">带标签</span>
          <div class="demo-w260">
            <Input
              v-model="inputValue"
              label="用户名"
              placeholder="请输入用户名"
            />
          </div>
        </div>
        <div class="demo-row">
          <span class="demo-label">辅助说明</span>
          <div class="demo-w260">
            <Input
              v-model="inputValue"
              label="邮箱"
              helper="请输入有效的邮箱地址"
              placeholder="example@mail.com"
            />
          </div>
        </div>
        <div class="demo-row">
          <span class="demo-label">错误状态</span>
          <div class="demo-w260">
            <Input
              v-model="inputErrorValue"
              label="密码"
              error="密码长度不能少于 8 位"
              type="password"
            />
          </div>
        </div>
        <div class="demo-row">
          <span class="demo-label">禁用</span>
          <div class="demo-w260">
            <Input model-value="不可编辑" disabled />
          </div>
        </div>
        <div class="demo-row">
          <span class="demo-label">数字</span>
          <div class="demo-w160">
            <Input model-value="42" label="数量" type="number" />
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §4 Textarea -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§4 Textarea</h2>
      <p class="demo-section-desc">多行文本输入，复用 Input 的 Token 体系。</p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">基础</span>
          <div class="demo-w320">
            <Textarea v-model="textareaValue" placeholder="请输入多行文本..." />
          </div>
        </div>
        <div class="demo-row">
          <span class="demo-label">带标签+计数</span>
          <div class="demo-w320">
            <Textarea
              v-model="textareaValue"
              label="简介"
              :helper="`${textareaValue.length} / 200`"
              :max-length="200"
              :rows="4"
              placeholder="请填写简介，最多 200 字"
            />
          </div>
        </div>
        <div class="demo-row">
          <span class="demo-label">错误状态</span>
          <div class="demo-w320">
            <Textarea
              model-value=""
              label="必填项"
              error="此字段为必填项"
              placeholder="请输入..."
            />
          </div>
        </div>
        <div class="demo-row">
          <span class="demo-label">禁用</span>
          <div class="demo-w320">
            <Textarea model-value="这是一段只读的文本内容。" disabled />
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §5 Select -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§5 Select</h2>
      <p class="demo-section-desc">
        下拉选择器，Reka Select 骨架 + .glass 面板 Token。
      </p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">基础</span>
          <Select
            v-model="selectValue"
            :options="fruitOptions"
            placeholder="请选择水果..."
          />
        </div>
        <div class="demo-row">
          <span class="demo-label">带标签</span>
          <Select
            v-model="selectValue"
            :options="fruitOptions"
            label="水果"
            placeholder="请选择..."
          />
        </div>
        <div class="demo-row">
          <span class="demo-label">已选中</span>
          <Select
            model-value="apple"
            :options="fruitOptions"
            label="已选水果"
          />
        </div>
        <div class="demo-row">
          <span class="demo-label">禁用</span>
          <Select
            model-value=""
            :options="fruitOptions"
            placeholder="不可用"
            disabled
          />
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §6 Switch -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§6 Switch</h2>
      <p class="demo-section-desc">布尔值开关，Reka Switch 骨架。</p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">基础</span>
          <Switch v-model="switchOn" />
        </div>
        <div class="demo-row">
          <span class="demo-label">带标签</span>
          <Switch v-model="switchOn" :label="switchOn ? '已开启' : '已关闭'" />
        </div>
        <div class="demo-row">
          <span class="demo-label">开启态</span>
          <Switch :model-value="true" label="通知开关" />
        </div>
        <div class="demo-row">
          <span class="demo-label">禁用</span>
          <Switch :model-value="false" label="不可操作" disabled />
          <Switch :model-value="true" disabled />
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §7 Tooltip -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§7 Tooltip</h2>
      <p class="demo-section-desc">悬停提示，仅文字，深色固定不随主题变化。</p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">上（默认）</span>
          <Tooltip content="这是上方弹出的提示文字"
            ><Button variant="subtle">悬停看提示（上）</Button></Tooltip
          >
        </div>
        <div class="demo-row">
          <span class="demo-label">四个方向</span>
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
        <div class="demo-row">
          <span class="demo-label">长延迟</span>
          <Tooltip content="悬停 1 秒后才出现" :delay-duration="1000"
            ><Button variant="subtle">悬停 1s</Button></Tooltip
          >
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §8 Popover -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§8 Popover</h2>
      <p class="demo-section-desc">轻量弹出卡片，点击触发，可嵌套任意组件。</p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">表单卡片</span>
          <Popover side="bottom" align="start">
            <template #trigger
              ><Button variant="secondary">打开筛选面板</Button></template
            >
            <div class="demo-popover-form">
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
        <div class="demo-row">
          <span class="demo-label">不同对齐</span>
          <Popover side="bottom" align="start">
            <template #trigger
              ><Button variant="subtle">开头对齐</Button></template
            >
            <div class="demo-popover-text">这是一个开头对齐的卡片</div>
          </Popover>
          <Popover side="bottom" align="center">
            <template #trigger
              ><Button variant="subtle">居中对齐</Button></template
            >
            <div class="demo-popover-text">这是一个居中对齐的卡片</div>
          </Popover>
          <Popover side="bottom" align="end">
            <template #trigger
              ><Button variant="subtle">末尾对齐</Button></template
            >
            <div class="demo-popover-text">这是一个末尾对齐的卡片</div>
          </Popover>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §9 DropdownMenu -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§9 DropdownMenu</h2>
      <p class="demo-section-desc">
        下拉菜单，支持图标、快捷键、分隔线、危险项。
      </p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">完整菜单</span>
          <DropdownMenu :items="dropdownItems" :trigger="dropdownTriggerFull" />
        </div>
        <div class="demo-row">
          <span class="demo-label">纯文字菜单</span>
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

    <!-- ================================================ -->
    <!-- §10 ContextMenu -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§10 ContextMenu</h2>
      <p class="demo-section-desc">
        右键菜单，完全复用 DropdownMenu 的 MenuItem 结构和样式。
      </p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">右键区域</span>
          <ContextMenu :items="contextMenuItems">
            <div class="demo-context-area demo-context-cursor">
              在此区域右键点击查看菜单
            </div>
          </ContextMenu>
        </div>
        <div class="demo-row">
          <span class="demo-label">禁用右键</span>
          <ContextMenu :items="contextMenuItems" disabled>
            <div class="demo-context-area">此区域右键菜单已禁用</div>
          </ContextMenu>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §11 Dialog -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§11 Dialog</h2>
      <p class="demo-section-desc">
        通用弹窗，遮罩层模糊背景，内部可自由组合任意下层组件。
      </p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">Trigger触发</span>
          <Button variant="primary" @click="dialogTriggerOpen = true"
            >打开弹窗（Trigger）</Button
          >
          <Dialog
            :open="dialogTriggerOpen"
            title="用户信息"
            description="请填写以下信息"
            @update:open="dialogTriggerOpen = $event"
          >
            <div class="demo-section-body">
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
        <div class="demo-row">
          <span class="demo-label">外部受控</span>
          <Button variant="secondary" @click="dialogOpen = true"
            >打开弹窗（受控）</Button
          >
          <Dialog
            :open="dialogOpen"
            title="提示"
            description="这是一个外部状态控制的弹窗"
            @update:open="dialogOpen = $event"
          >
            <p class="demo-text">弹窗内容区域，可以放置任意组件。</p>
          </Dialog>
        </div>
        <div class="demo-row">
          <span class="demo-label">无description</span>
          <Button variant="subtle" @click="dialogSimpleOpen = true"
            >简洁弹窗</Button
          >
          <Dialog
            :open="dialogSimpleOpen"
            title="简洁标题"
            @update:open="dialogSimpleOpen = $event"
          >
            <p class="demo-text">没有 description 的简洁弹窗。</p>
          </Dialog>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §12 Confirm -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§12 Confirm</h2>
      <p class="demo-section-desc">Dialog 的预设子集，预置按钮槽位。</p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">默认确认</span>
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
            <p class="demo-text">确定要删除选中的 3 个文件吗？</p>
          </Confirm>
        </div>
        <div class="demo-row">
          <span class="demo-label">危险确认</span>
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
        <div class="demo-row">
          <span class="demo-label">额外按钮</span>
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
            <p class="demo-text">如果选择不保存，所有未保存的修改将会丢失。</p>
          </Confirm>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §13 Toast -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§13 Toast</h2>
      <p class="demo-section-desc">
        全局消息通知，独立通知通道。点击按钮触发，Toast 从右下角滑入。
      </p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">四种变体</span>
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
        <div class="demo-row">
          <span class="demo-label">带操作按钮</span>
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
        <div class="demo-row">
          <span class="demo-label">纯字符串调用</span>
          <Button
            variant="subtle"
            @click="toast('你好，这是一条快捷消息', 'info')"
            >快捷 Toast</Button
          >
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §14 Tabs -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§14 Tabs</h2>
      <p class="demo-section-desc">标签页切换容器，Reka Tabs 骨架。</p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">带图标</span>
          <div class="demo-w100">
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
        <div class="demo-row">
          <span class="demo-label">纯文字</span>
          <div class="demo-w100">
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

    <!-- ================================================ -->
    <!-- §15 ScrollArea -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§15 ScrollArea</h2>
      <p class="demo-section-desc">统一样式的滚动容器，替换原生滚动条。</p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">固定高度</span>
          <div class="demo-box-400">
            <ScrollArea :max-height="160">
              <div class="demo-scroll-padding">
                <p v-for="i in scrollLines" :key="i" class="demo-scroll-line">
                  第 {{ i }} 行：这是一段用于演示滚动区域的示例文本内容。
                </p>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §16 EmptyState -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§16 EmptyState</h2>
      <p class="demo-section-desc">空状态占位，列表无数据时显示。</p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">默认</span>
          <div class="demo-box-400">
            <EmptyState title="暂无数据" description="稍后再来看看吧" />
          </div>
        </div>
        <div class="demo-row">
          <span class="demo-label">带操作</span>
          <div class="demo-box-400">
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
        <div class="demo-row">
          <span class="demo-label">自定义图标</span>
          <div class="demo-box-400">
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

    <!-- ================================================ -->
    <!-- §17 Skeleton -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§17 Skeleton</h2>
      <p class="demo-section-desc">骨架屏，内容加载中的占位动画。</p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">文本</span>
          <div class="demo-w300"><Skeleton variant="text" /></div>
        </div>
        <div class="demo-row">
          <span class="demo-label">段落（5行）</span>
          <div class="demo-w320"><Skeleton variant="text" :count="5" /></div>
        </div>
        <div class="demo-row">
          <span class="demo-label">圆形</span>
          <Skeleton variant="circle" :width="48" :height="48" />
          <Skeleton variant="circle" :width="32" :height="32" />
          <Skeleton variant="circle" :width="24" :height="24" />
        </div>
        <div class="demo-row">
          <span class="demo-label">矩形</span>
          <Skeleton variant="rect" :width="200" :height="120" />
          <Skeleton variant="rect" width="100%" :height="40" />
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §18 Accordion -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§18 Accordion</h2>
      <p class="demo-section-desc">手风琴折叠面板，支持展开收起。</p>
      <div class="demo-section-body">
        <div class="demo-box-560">
          <Accordion :items="accordionItems" />
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §19 AlertDialog -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§19 AlertDialog</h2>
      <p class="demo-section-desc">关键操作确认弹窗，必须明确确认或取消。</p>
      <div class="demo-row">
        <AlertDialog
          :open="alertDialogOpen"
          title="确认删除？"
          description="此操作不可撤销"
          cancel-label="取消"
          action-label="删除"
          @update:open="alertDialogOpen = $event"
          @cancel="toast('已取消删除', 'info')"
          @action="toast('已删除', 'success')"
        >
          <template #trigger>
            <Button variant="danger">打开 AlertDialog</Button>
          </template>
          删除后数据无法恢复。
        </AlertDialog>
        <Button variant="secondary" @click="alertDialogTriggerOpen = true">
          受控打开
        </Button>
        <AlertDialog
          :open="alertDialogTriggerOpen"
          title="受控弹窗"
          action-label="知道了"
          @update:open="alertDialogTriggerOpen = $event"
        >
          这是一个受控 AlertDialog 示例。
        </AlertDialog>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §20 AspectRatio -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§20 AspectRatio</h2>
      <p class="demo-section-desc">固定宽高比容器。</p>
      <div class="demo-row">
        <div class="demo-w240">
          <AspectRatio :ratio="16 / 9">
            <div class="demo-aspect-fill">16:9</div>
          </AspectRatio>
        </div>
        <div class="demo-w160">
          <AspectRatio :ratio="1">
            <div class="demo-aspect-fill">1:1</div>
          </AspectRatio>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §21 Checkbox -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§21 Checkbox</h2>
      <p class="demo-section-desc">复选框，支持受控勾选与禁用态。</p>
      <div class="demo-row">
        <Checkbox v-model="checkboxChecked" label="同意条款" />
        <Checkbox :model-value="true" label="已启用" disabled />
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §22 Collapsible -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§22 Collapsible</h2>
      <p class="demo-section-desc">可展开/收起的折叠内容区。</p>
      <div class="demo-box-480">
        <Collapsible v-model:open="collapsibleOpen">
          <template #trigger>展开详细信息</template>
          这里是折叠后的详细内容，用于展示更多信息。
        </Collapsible>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §23 HoverCard -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§23 HoverCard</h2>
      <p class="demo-section-desc">鼠标悬停后弹出的信息卡片。</p>
      <div class="demo-row">
        <HoverCard>
          <template #trigger>
            <Button variant="secondary">悬停查看</Button>
          </template>
          这是 HoverCard 内容。
        </HoverCard>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §24 Label -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§24 Label</h2>
      <p class="demo-section-desc">表单标签，点击可聚焦关联控件。</p>
      <div class="demo-row">
        <Label html-for="demo-label-input">用户名</Label>
        <div class="demo-w200">
          <Input
            id="demo-label-input"
            v-model="inputValue"
            placeholder="请输入用户名"
          />
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §25 Menubar -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§25 Menubar</h2>
      <p class="demo-section-desc">桌面风格顶部菜单栏。</p>
      <div class="demo-row">
        <Menubar :menus="menubarMenus" />
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §26 NavigationMenu -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§26 NavigationMenu</h2>
      <p class="demo-section-desc">导航菜单，可展开内容或直接点击。</p>
      <div class="demo-row">
        <NavigationMenu :items="navigationItems" />
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §27 Progress -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§27 Progress</h2>
      <p class="demo-section-desc">进度条，展示任务完成度。</p>
      <div class="demo-section-body">
        <div class="demo-row">
          <span class="demo-label">60%</span>
          <div class="demo-w300"><Progress :value="60" /></div>
        </div>
        <div class="demo-row">
          <span class="demo-label">100%</span>
          <div class="demo-w300"><Progress :value="100" /></div>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §28 RadioGroup -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§28 RadioGroup</h2>
      <p class="demo-section-desc">单选组，支持键盘方向键切换。</p>
      <div class="demo-row">
        <RadioGroup v-model="radioValue" :options="radioOptions" label="选项" />
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §29 Separator -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§29 Separator</h2>
      <p class="demo-section-desc">横向或纵向视觉分隔线。</p>
      <div class="demo-section-body">
        <Separator />
        <div class="demo-separator-vertical-wrap">
          <Separator orientation="vertical" class="demo-h100" />
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §30 Slider -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§30 Slider</h2>
      <p class="demo-section-desc">滑块，适合音量、亮度等数值场景。</p>
      <div class="demo-row">
        <span class="demo-label">数值</span>
        <div class="demo-w280">
          <Slider v-model="sliderValue" :min="0" :max="100" />
        </div>
        <span>{{ sliderValue[0] }}</span>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §31 Toggle -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§31 Toggle</h2>
      <p class="demo-section-desc">按压态按钮，适合图标开关。</p>
      <div class="demo-row">
        <Toggle v-model:pressed="togglePressed" aria-label="切换状态">
          粗体
        </Toggle>
        <Toggle :pressed="true" disabled aria-label="禁用状态"> 锁定 </Toggle>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §32 VisuallyHidden -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§32 VisuallyHidden</h2>
      <p class="demo-section-desc">视觉隐藏但保留给读屏器/搜索引擎。</p>
      <div class="demo-row">
        <span>这段文字可见。</span>
        <VisuallyHidden>这段文字仅读屏器可见。</VisuallyHidden>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §33 Drawer -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§33 Drawer</h2>
      <p class="demo-section-desc">从屏幕边缘滑出的抽屉面板。</p>
      <div class="demo-row">
        <Drawer v-model:open="drawerOpen" title="设置" side="right" :size="320">
          <template #trigger>
            <Button variant="secondary">打开右侧抽屉</Button>
          </template>
          抽屉内容区域。
        </Drawer>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §34 SegmentedControl -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§34 SegmentedControl</h2>
      <p class="demo-section-desc">分段选择器。</p>
      <div class="demo-row">
        <SegmentedControl v-model="segmentValue" :options="segmentOptions" />
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §35 Rating -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§35 Rating</h2>
      <p class="demo-section-desc">星级评分。</p>
      <div class="demo-row">
        <Rating v-model="ratingValue" :max="5" />
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §36 Breadcrumb -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§36 Breadcrumb</h2>
      <p class="demo-section-desc">面包屑导航，最后一项为当前页。</p>
      <div class="demo-row">
        <Breadcrumb :items="breadcrumbItems" />
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §37 Combobox -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§37 Combobox</h2>
      <p class="demo-section-desc">可输入过滤的下拉选择框。</p>
      <div class="demo-row">
        <div class="demo-w260">
          <Combobox
            v-model="comboboxValue"
            :options="comboboxOptions"
            placeholder="搜索水果..."
          />
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §38 CommandPalette -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§38 CommandPalette</h2>
      <p class="demo-section-desc">命令面板，支持输入过滤与键盘选择。</p>
      <div class="demo-row">
        <Button variant="secondary" @click="commandOpen = true"
          >打开命令面板</Button
        >
        <CommandPalette
          v-model:open="commandOpen"
          :items="commandItems"
          placeholder="输入命令或搜索..."
        />
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §39 Stepper -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§39 Stepper</h2>
      <p class="demo-section-desc">步骤条，可点击已到达步骤回退。</p>
      <div class="demo-section-body">
        <Stepper
          :steps="stepperSteps"
          :current="stepperCurrent"
          @change="
            (index: number) => {
              stepperCurrent = index
            }
          "
        />
        <div class="demo-row">
          <Button
            variant="subtle"
            @click="stepperCurrent = Math.max(0, stepperCurrent - 1)"
          >
            上一步
          </Button>
          <Button
            variant="subtle"
            @click="
              stepperCurrent = Math.min(
                stepperSteps.length - 1,
                stepperCurrent + 1,
              )
            "
          >
            下一步
          </Button>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §40 Toolbar -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§40 Toolbar</h2>
      <p class="demo-section-desc">工具条容器。</p>
      <div class="demo-row">
        <Toolbar aria-label="示例工具栏">
          <Button variant="subtle">新建</Button>
          <Button variant="subtle">打开</Button>
          <Separator orientation="vertical" />
          <Button variant="subtle">删除</Button>
        </Toolbar>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §41 Calendar -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§41 Calendar</h2>
      <p class="demo-section-desc">日历面板，支持月份切换与日期选择。</p>
      <div class="demo-row">
        <Calendar v-model="dateValue" />
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §42 DatePicker -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§42 DatePicker</h2>
      <p class="demo-section-desc">Popover + Calendar 组合日期选择。</p>
      <div class="demo-row">
        <DatePicker v-model="datePickerValue" label="日期" />
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §43 TreeSelect -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§43 TreeSelect</h2>
      <p class="demo-section-desc">树形数据选择。</p>
      <div class="demo-w280">
        <TreeSelect
          v-model="treeValue"
          :options="treeOptions"
          placeholder="请选择节点"
        />
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §44 Cascader -->
    <!-- ================================================ -->
    <section class="demo-section">
      <h2 class="demo-section-title">§44 Cascader</h2>
      <p class="demo-section-desc">级联选择，按多列路径逐级选择。</p>
      <div class="demo-w280">
        <Cascader
          v-model="cascaderValue"
          :options="cascaderOptions"
          placeholder="请选择地区"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.demo-page {
  max-width: 860px;
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.demo-page-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.demo-page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  font-family: var(--font-heading);
}

.demo-page-subtitle {
  margin: 0;
  margin-top: var(--spacing-sm);
  color: var(--muted);
  font-size: var(--text-sm);
}

.demo-section {
  margin-bottom: var(--spacing-2xl);
  padding: var(--spacing-xl);
  border: 1px solid var(--glass-brd);
  border-radius: var(--radius-xl);
  background: var(--glass);
  backdrop-filter: blur(var(--blur-panel));
}

.demo-section-title {
  margin: 0;
  margin-bottom: var(--spacing-xs);
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--text);
}

.demo-section-desc {
  margin: 0;
  margin-bottom: var(--spacing-lg);
  font-size: var(--text-sm);
  color: var(--muted);
}

.demo-section-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.demo-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.demo-label {
  font-size: var(--text-sm);
  color: var(--muted);
  min-width: 80px;
}

.demo-w100 {
  width: 100%;
}
.demo-w160 {
  width: 160px;
}
.demo-w200 {
  width: 200px;
}
.demo-w240 {
  width: 240px;
}
.demo-w260 {
  width: 260px;
}
.demo-w280 {
  width: 280px;
}
.demo-w300 {
  width: 300px;
}
.demo-w320 {
  width: 320px;
}
.demo-h100 {
  height: 100%;
}
.demo-box-400 {
  width: 100%;
  max-width: 400px;
}
.demo-box-480 {
  width: 100%;
  max-width: 480px;
}
.demo-box-560 {
  width: 100%;
  max-width: 560px;
}
.demo-separator-vertical-wrap {
  height: 80px;
  display: flex;
  align-items: center;
}
.demo-separator-vertical {
  height: 100%;
}

.demo-fallback-center {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
}

.demo-popover-form {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-width: 220px;
}

.demo-popover-text {
  padding: var(--spacing-lg);
  color: var(--text);
  font-size: var(--text-sm);
}

.demo-context-area {
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-xl);
  border: 2px dashed var(--glass-brd);
  border-radius: var(--radius-lg);
  text-align: center;
  color: var(--muted);
  font-size: var(--text-sm);
}

.demo-context-cursor {
  cursor: context-menu;
}

.demo-text {
  color: var(--text);
  font-size: var(--text-sm);
}

.demo-scroll-padding {
  padding-right: var(--spacing-md);
}

.demo-scroll-line {
  color: var(--text);
  font-size: var(--text-sm);
  margin: 0;
  padding: var(--spacing-sm) 0;
}

.demo-aspect-fill {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--muted);
}
</style>
