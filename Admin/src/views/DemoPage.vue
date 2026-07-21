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
} from '@/components/common'
import type { MenuItem, SelectOption, TabItem } from '@/components/common/types'

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
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:edit', width: 14 })),
    shortcut: '⌘E',
    onClick: () => toast('点击了编辑', 'info'),
  },
  {
    label: '复制',
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:copy', width: 14 })),
    shortcut: '⌘C',
    onClick: () => toast('已复制', 'success'),
  },
  {
    label: '刷新',
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:refresh', width: 14 })),
    onClick: () => toast('已刷新', 'success'),
  },
  { label: '', separator: true },
  {
    label: '删除',
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:trash', width: 14 })),
    danger: true,
    onClick: () => toast('删除操作需确认', 'warn'),
  },
]

// ---- ContextMenu 菜单项 ----
const contextMenuItems: MenuItem[] = [
  {
    label: '查看详情',
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:info', width: 14 })),
    onClick: () => toast('查看详情', 'info'),
  },
  {
    label: '复制文本',
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:copy', width: 14 })),
    shortcut: '⌘C',
    onClick: () => toast('已复制', 'success'),
  },
  { label: '', separator: true },
  {
    label: '删除',
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:trash', width: 14 })),
    danger: true,
    onClick: () => toast('已删除', 'error'),
  },
]

// ---- Tabs ----
const demoTabs: TabItem[] = [
  {
    id: 'tab-1',
    label: '概览',
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:home', width: 14 })),
    content: h(
      'p',
      { style: { color: 'var(--text)', fontSize: 'var(--text-base)' } },
      '这是概览标签页的内容。',
    ),
  },
  {
    id: 'tab-2',
    label: '设置',
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:settings-gear', width: 14 })),
    content: h(
      'p',
      { style: { color: 'var(--text)', fontSize: 'var(--text-base)' } },
      '这是设置标签页的内容。',
    ),
  },
  {
    id: 'tab-3',
    label: '通知',
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:bell', width: 14 })),
    content: h(
      'p',
      { style: { color: 'var(--text)', fontSize: 'var(--text-base)' } },
      '这是通知标签页的内容。',
    ),
  },
]

// ---- ScrollArea 示例长文本 ----
const scrollLines = Array.from({ length: 20 }, (_, i) => i + 1)

const sectionStyle = {
  marginBottom: 'var(--spacing-2xl)',
  padding: 'var(--spacing-xl)',
  border: '1px solid var(--glass-brd)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--glass)',
  backdropFilter: 'blur(var(--blur-panel))',
} as const
const sectionTitleStyle = {
  margin: '0',
  marginBottom: 'var(--spacing-xs)',
  fontSize: 'var(--text-md)',
  fontWeight: '700',
  color: 'var(--text)',
} as const
const sectionDescStyle = {
  margin: '0',
  marginBottom: 'var(--spacing-lg)',
  fontSize: 'var(--text-sm)',
  color: 'var(--muted)',
} as const
const sectionBodyStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-md)',
} as const
const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-md)',
  flexWrap: 'wrap',
} as const
const labelStyle = {
  fontSize: 'var(--text-sm)',
  color: 'var(--muted)',
  minWidth: '80px',
} as const

// ---- DropdownMenu trigger VNodes（h() 在 script 中创建，传给 :trigger prop） ----
const dropdownTriggerFull = h(Button, { variant: 'secondary' }, () => '打开菜单')
const dropdownTriggerPlain = h(Button, { variant: 'subtle' }, () => '简单菜单')

log.info('进入Demo页')
</script>

<template>
  <div
    :style="{
      maxWidth: '860px',
      margin: '0 auto',
      padding: 'var(--spacing-2xl) var(--spacing-xl)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-xl)',
    }"
  >
    <!-- 页面标题 -->
    <div :style="{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }">
      <h1
        :style="{
          margin: '0',
          fontSize: '24px',
          fontWeight: '700',
          color: 'var(--text)',
          fontFamily: 'var(--font-heading)',
        }"
      >
        Common 组件示例
      </h1>
      <p
        :style="{
          margin: '0',
          marginTop: 'var(--spacing-sm)',
          color: 'var(--muted)',
          fontSize: 'var(--text-sm)',
        }"
      >
        共 17 个基础组件，一一展示常规用法
      </p>
    </div>

    <!-- ================================================ -->
    <!-- §1 Button -->
    <!-- ================================================ -->
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§1 Button</h2>
      <p :style="sectionDescStyle">
        封装 loading 态的原子按钮，样式来自全局 .btn.* 类。
      </p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">变体</span>
          <Button variant="primary">主按钮</Button>
          <Button variant="secondary">次要按钮</Button>
          <Button variant="subtle">低调按钮</Button>
          <Button variant="danger">危险按钮</Button>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">带图标</span>
          <Button variant="primary"
            ><template #icon><IconContainer :size="14"><Icon icon="codicon:add" :width="14" /></IconContainer></template
            >新建</Button
          >
          <Button variant="secondary"
            ><template #icon
              ><IconContainer :size="14"><Icon icon="codicon:search" :width="14" /></IconContainer></template
            >搜索</Button
          >
          <Button variant="subtle"
            ><template #icon><IconContainer :size="14"><Icon icon="codicon:edit" :width="14" /></IconContainer></template
            >编辑</Button
          >
          <Button variant="danger"
            ><template #icon><IconContainer :size="14"><Icon icon="codicon:trash" :width="14" /></IconContainer></template
            >删除</Button
          >
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">Loading</span>
          <Button variant="primary" loading>提交中</Button>
          <Button variant="primary" loading loading-text="保存中..."
            >保存</Button
          >
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">禁用</span>
          <Button variant="primary" disabled>禁用主按钮</Button>
          <Button variant="secondary" disabled>禁用次要按钮</Button>
          <Button variant="subtle" disabled>禁用低调按钮</Button>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">全宽</span>
          <Button variant="subtle" block>全宽列表项</Button>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §2 IconContainer -->
    <!-- ================================================ -->
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§2 IconContainer</h2>
      <p :style="sectionDescStyle">
        统一图片/图标容器，固定尺寸居中裁剪。注意 shape
        差异在非圆形素材上更明显。
      </p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">圆角方形</span>
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
        <div :style="rowStyle">
          <span :style="labelStyle">圆形</span>
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
        <div :style="rowStyle">
          <span :style="labelStyle">图标组件</span>
          <IconContainer :size="40" shape="rounded"
            ><Icon icon="codicon:github" :width="22"
          /></IconContainer>
          <IconContainer :size="40" shape="circle"
            ><Icon icon="codicon:home" :width="20"
          /></IconContainer>
          <IconContainer :size="40" shape="rounded"
            ><Icon icon="codicon:person" :width="22"
          /></IconContainer>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">加载失败</span>
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
              <div
                :style="{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--muted)',
                }"
              >
                <Icon icon="codicon:error" :width="22" />
              </div>
            </template>
          </IconContainer>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §3 Input -->
    <!-- ================================================ -->
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§3 Input</h2>
      <p :style="sectionDescStyle">
        单行文本输入，支持 label / helper / error 状态。
      </p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">基础</span>
          <div style="width: 260px">
            <Input v-model="inputValue" placeholder="请输入内容..." />
          </div>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">带标签</span>
          <div style="width: 260px">
            <Input
              v-model="inputValue"
              label="用户名"
              placeholder="请输入用户名"
            />
          </div>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">辅助说明</span>
          <div style="width: 260px">
            <Input
              v-model="inputValue"
              label="邮箱"
              helper="请输入有效的邮箱地址"
              placeholder="example@mail.com"
            />
          </div>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">错误状态</span>
          <div style="width: 260px">
            <Input
              v-model="inputErrorValue"
              label="密码"
              error="密码长度不能少于 8 位"
              type="password"
            />
          </div>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">禁用</span>
          <div style="width: 260px">
            <Input model-value="不可编辑" disabled />
          </div>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">数字</span>
          <div style="width: 160px">
            <Input model-value="42" label="数量" type="number" />
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §4 Textarea -->
    <!-- ================================================ -->
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§4 Textarea</h2>
      <p :style="sectionDescStyle">多行文本输入，复用 Input 的 Token 体系。</p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">基础</span>
          <div style="width: 320px">
            <Textarea v-model="textareaValue" placeholder="请输入多行文本..." />
          </div>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">带标签+计数</span>
          <div style="width: 320px">
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
        <div :style="rowStyle">
          <span :style="labelStyle">错误状态</span>
          <div style="width: 320px">
            <Textarea
              model-value=""
              label="必填项"
              error="此字段为必填项"
              placeholder="请输入..."
            />
          </div>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">禁用</span>
          <div style="width: 320px">
            <Textarea model-value="这是一段只读的文本内容。" disabled />
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §5 Select -->
    <!-- ================================================ -->
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§5 Select</h2>
      <p :style="sectionDescStyle">
        下拉选择器，Reka Select 骨架 + .glass 面板 Token。
      </p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">基础</span>
          <Select
            v-model="selectValue"
            :options="fruitOptions"
            placeholder="请选择水果..."
          />
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">带标签</span>
          <Select
            v-model="selectValue"
            :options="fruitOptions"
            label="水果"
            placeholder="请选择..."
          />
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">已选中</span>
          <Select
            model-value="apple"
            :options="fruitOptions"
            label="已选水果"
          />
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">禁用</span>
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
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§6 Switch</h2>
      <p :style="sectionDescStyle">布尔值开关，Reka Switch 骨架。</p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">基础</span>
          <Switch v-model="switchOn" />
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">带标签</span>
          <Switch v-model="switchOn" :label="switchOn ? '已开启' : '已关闭'" />
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">开启态</span>
          <Switch :model-value="true" label="通知开关" />
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">禁用</span>
          <Switch :model-value="false" label="不可操作" disabled />
          <Switch :model-value="true" disabled />
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §7 Tooltip -->
    <!-- ================================================ -->
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§7 Tooltip</h2>
      <p :style="sectionDescStyle">悬停提示，仅文字，深色固定不随主题变化。</p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">上（默认）</span>
          <Tooltip content="这是上方弹出的提示文字"
            ><Button variant="subtle">悬停看提示（上）</Button></Tooltip
          >
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">四个方向</span>
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
        <div :style="rowStyle">
          <span :style="labelStyle">长延迟</span>
          <Tooltip content="悬停 1 秒后才出现" :delay-duration="1000"
            ><Button variant="subtle">悬停 1s</Button></Tooltip
          >
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §8 Popover -->
    <!-- ================================================ -->
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§8 Popover</h2>
      <p :style="sectionDescStyle">轻量弹出卡片，点击触发，可嵌套任意组件。</p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">表单卡片</span>
          <Popover side="bottom" align="start">
            <template #trigger
              ><Button variant="secondary">打开筛选面板</Button></template
            >
            <div
              :style="{
                padding: 'var(--spacing-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
                minWidth: '220px',
              }"
            >
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
        <div :style="rowStyle">
          <span :style="labelStyle">不同对齐</span>
          <Popover side="bottom" align="start">
            <template #trigger
              ><Button variant="subtle">开头对齐</Button></template
            >
            <div
              :style="{
                padding: 'var(--spacing-lg)',
                color: 'var(--text)',
                fontSize: 'var(--text-sm)',
              }"
            >
              这是一个开头对齐的卡片
            </div>
          </Popover>
          <Popover side="bottom" align="center">
            <template #trigger
              ><Button variant="subtle">居中对齐</Button></template
            >
            <div
              :style="{
                padding: 'var(--spacing-lg)',
                color: 'var(--text)',
                fontSize: 'var(--text-sm)',
              }"
            >
              这是一个居中对齐的卡片
            </div>
          </Popover>
          <Popover side="bottom" align="end">
            <template #trigger
              ><Button variant="subtle">末尾对齐</Button></template
            >
            <div
              :style="{
                padding: 'var(--spacing-lg)',
                color: 'var(--text)',
                fontSize: 'var(--text-sm)',
              }"
            >
              这是一个末尾对齐的卡片
            </div>
          </Popover>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §9 DropdownMenu -->
    <!-- ================================================ -->
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§9 DropdownMenu</h2>
      <p :style="sectionDescStyle">
        下拉菜单，支持图标、快捷键、分隔线、危险项。
      </p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">完整菜单</span>
          <DropdownMenu :items="dropdownItems" :trigger="dropdownTriggerFull" />
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">纯文字菜单</span>
          <DropdownMenu
            :items="[
              { label: '选项一', onClick: () => toast('选项一', 'info') },
              { label: '选项二', onClick: () => toast('选项二', 'info') },
              { label: '', separator: true },
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
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§10 ContextMenu</h2>
      <p :style="sectionDescStyle">
        右键菜单，完全复用 DropdownMenu 的 MenuItem 结构和样式。
      </p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">右键区域</span>
          <ContextMenu :items="contextMenuItems">
            <div
              :style="{
                width: '100%',
                maxWidth: '400px',
                padding: 'var(--spacing-xl)',
                border: '2px dashed var(--glass-brd)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: 'var(--text-sm)',
                cursor: 'context-menu',
              }"
            >
              在此区域右键点击查看菜单
            </div>
          </ContextMenu>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">禁用右键</span>
          <ContextMenu :items="contextMenuItems" disabled>
            <div
              :style="{
                width: '100%',
                maxWidth: '400px',
                padding: 'var(--spacing-xl)',
                border: '2px dashed var(--glass-brd)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: 'var(--text-sm)',
              }"
            >
              此区域右键菜单已禁用
            </div>
          </ContextMenu>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §11 Dialog -->
    <!-- ================================================ -->
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§11 Dialog</h2>
      <p :style="sectionDescStyle">
        通用弹窗，遮罩层模糊背景，内部可自由组合任意下层组件。
      </p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">Trigger触发</span>
          <Button variant="primary" @click="dialogTriggerOpen = true"
            >打开弹窗（Trigger）</Button
          >
          <Dialog
            :open="dialogTriggerOpen"
            title="用户信息"
            description="请填写以下信息"
            @update:open="dialogTriggerOpen = $event"
          >
            <div :style="sectionBodyStyle">
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
        <div :style="rowStyle">
          <span :style="labelStyle">外部受控</span>
          <Button variant="secondary" @click="dialogOpen = true"
            >打开弹窗（受控）</Button
          >
          <Dialog
            :open="dialogOpen"
            title="提示"
            description="这是一个外部状态控制的弹窗"
            @update:open="dialogOpen = $event"
          >
            <p :style="{ color: 'var(--text)', fontSize: 'var(--text-sm)' }">
              弹窗内容区域，可以放置任意组件。
            </p>
          </Dialog>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">无description</span>
          <Button variant="subtle" @click="dialogSimpleOpen = true"
            >简洁弹窗</Button
          >
          <Dialog
            :open="dialogSimpleOpen"
            title="简洁标题"
            @update:open="dialogSimpleOpen = $event"
          >
            <p :style="{ color: 'var(--text)', fontSize: 'var(--text-sm)' }">
              没有 description 的简洁弹窗。
            </p>
          </Dialog>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §12 Confirm -->
    <!-- ================================================ -->
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§12 Confirm</h2>
      <p :style="sectionDescStyle">Dialog 的预设子集，预置按钮槽位。</p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">默认确认</span>
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
            <p :style="{ color: 'var(--text)', fontSize: 'var(--text-sm)' }">
              确定要删除选中的 3 个文件吗？
            </p>
          </Confirm>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">危险确认</span>
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
        <div :style="rowStyle">
          <span :style="labelStyle">额外按钮</span>
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
            <p :style="{ color: 'var(--text)', fontSize: 'var(--text-sm)' }">
              如果选择不保存，所有未保存的修改将会丢失。
            </p>
          </Confirm>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §13 Toast -->
    <!-- ================================================ -->
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§13 Toast</h2>
      <p :style="sectionDescStyle">
        全局消息通知，独立通知通道。点击按钮触发，Toast 从右下角滑入。
      </p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">四种变体</span>
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
        <div :style="rowStyle">
          <span :style="labelStyle">带操作按钮</span>
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
        <div :style="rowStyle">
          <span :style="labelStyle">纯字符串调用</span>
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
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§14 Tabs</h2>
      <p :style="sectionDescStyle">标签页切换容器，Reka Tabs 骨架。</p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">带图标</span>
          <div style="width: 100%">
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
        <div :style="rowStyle">
          <span :style="labelStyle">纯文字</span>
          <div style="width: 100%">
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
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§15 ScrollArea</h2>
      <p :style="sectionDescStyle">统一样式的滚动容器，替换原生滚动条。</p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">固定高度</span>
          <div :style="{ width: '100%', maxWidth: '400px' }">
            <ScrollArea :max-height="160">
              <div :style="{ paddingRight: 'var(--spacing-md)' }">
                <p
                  v-for="i in scrollLines"
                  :key="i"
                  :style="{
                    color: 'var(--text)',
                    fontSize: 'var(--text-sm)',
                    margin: '0',
                    padding: 'var(--spacing-sm) 0',
                  }"
                >
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
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§16 EmptyState</h2>
      <p :style="sectionDescStyle">空状态占位，列表无数据时显示。</p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">默认</span>
          <div :style="{ width: '100%', maxWidth: '400px' }">
            <EmptyState title="暂无数据" description="稍后再来看看吧" />
          </div>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">带操作</span>
          <div :style="{ width: '100%', maxWidth: '400px' }">
            <EmptyState title="还没有收藏" description="收藏的内容会显示在这里">
              <template #action>
                <Button variant="primary" @click="toast('去发现内容', 'info')">
                  <template #icon
                    ><IconContainer :size="14"><Icon icon="codicon:add" :width="14" /></IconContainer
                  ></template>
                  去发现
                </Button>
              </template>
            </EmptyState>
          </div>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">自定义图标</span>
          <div :style="{ width: '100%', maxWidth: '400px' }">
            <EmptyState title="无搜索结果" description="换个关键词试试">
              <template #icon
                ><IconContainer :size="48"><Icon icon="codicon:search" :width="48" /></IconContainer
              ></template>
            </EmptyState>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================ -->
    <!-- §17 Skeleton -->
    <!-- ================================================ -->
    <section :style="sectionStyle">
      <h2 :style="sectionTitleStyle">§17 Skeleton</h2>
      <p :style="sectionDescStyle">骨架屏，内容加载中的占位动画。</p>
      <div :style="sectionBodyStyle">
        <div :style="rowStyle">
          <span :style="labelStyle">文本</span>
          <div style="width: 300px"><Skeleton variant="text" /></div>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">段落（5行）</span>
          <div style="width: 320px"><Skeleton variant="text" :count="5" /></div>
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">圆形</span>
          <Skeleton variant="circle" :width="48" :height="48" />
          <Skeleton variant="circle" :width="32" :height="32" />
          <Skeleton variant="circle" :width="24" :height="24" />
        </div>
        <div :style="rowStyle">
          <span :style="labelStyle">矩形</span>
          <Skeleton variant="rect" :width="200" :height="120" />
          <Skeleton variant="rect" width="100%" :height="40" />
        </div>
      </div>
    </section>
  </div>
</template>
