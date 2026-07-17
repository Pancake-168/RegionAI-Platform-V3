<script setup lang="ts">
// LeftPanel — 后台管理页面的左侧面板
// 展示 NocoBase 子应用列表和根层级数据分组
// 用户选择后通过 emit 通知父组件
import { computed } from 'vue' // computed：从 info prop 派生应用列表和分组
import { createLogger } from '@/utils/logger' // 项目日志体系
import { Button, EmptyState, ScrollArea } from '@/components/common' // 通用组件

// 创建 logger 实例
const log = createLogger('LeftPanel.vue', 'LeftPanel')

// =====================
// Props 定义
// =====================

// info — 父组件传入的 NocoBase 探测结果 { data, errors }
type InfoPayload = { data?: Record<string, unknown> }

const props = defineProps<{
  info: InfoPayload | null // 探测结果，可能为 null（未请求或未登录）
}>()

// =====================
// Emits 定义
// =====================

const emit = defineEmits<{
  // 选中本层数据分组：key 是 data 中的数组键名（如 'users', 'roles'）
  (event: 'select-base', key: string): void
  // 选中子应用：app 是 application 列表中的单个对象
  (event: 'select-app', app: Record<string, unknown>): void
}>()

// =====================
// 派生数据
// =====================

// 从 info.data 提取原始数据对象（空对象兜底）
const baseData = computed<Record<string, unknown>>(
  () => (props.info?.data as Record<string, unknown>) || {},
)

// 从 data 中提取 applications 数组
const applications = computed<Array<Record<string, unknown>>>(() => {
  // 取 applications 字段，是数组则返回，否则返回空数组
  const list = baseData.value?.applications
  return Array.isArray(list) ? (list as Array<Record<string, unknown>>) : []
})

// 从 data 中提取本层数据分组：排除 applications/uiSchemas/uiSchemasTree/uiRoutes 外的所有数组 key
const baseGroups = computed<Array<{ key: string }>>(() => {
  // 取得 data 的所有 entries
  const entries = Object.entries(baseData.value || {})
  // 过滤条件：排除已知的非数组 key，且 value 必须是数组
  return entries
    .filter(
      ([key, value]) =>
        key !== 'applications' && // 子应用列表（已在顶部单独展示）
        key !== 'uiSchemas' && // UI Schema 列表（树形数据，不适合表格）
        key !== 'uiSchemasTree' && // UI Schema 树（同上）
        key !== 'uiRoutes' && // UI 路由（非列表数据）
        Array.isArray(value), // 必须是数组类型
    )
    .map(([key]) => ({ key })) // 只保留 key 用于展示
})

// =====================
// 工具函数
// =====================

// 获取列表项的唯一 key（优先 id → key → name → username → title → 随机值）
const itemKey = (item: Record<string, unknown>): string =>
  String(
    item?.id ??
      item?.key ??
      item?.name ??
      item?.username ??
      item?.title ??
      Math.random(),
  )

// =====================
// 事件处理
// =====================

// 选中本层数据分组
const selectBase = (key: string): void => {
  // 记录日志
  log.info('选中本层数据', { key })
  // 通知父组件
  emit('select-base', key)
}

// 选中子应用
const selectApp = (app: Record<string, unknown>): void => {
  // 记录日志：输出 app 的 displayName 或 name
  const appName = (app.displayName || app.name) as string
  log.info('选中子应用', { appName })
  // 通知父组件
  emit('select-app', app)
}
</script>

<template>
  <!-- 左侧面板根容器 -->
  <div class="panel">
    <!-- 子应用列表区域 -->
    <div class="header">
      <!-- 标题 -->
      <div class="title">子应用列表</div>
      <!-- 副标题 -->
      <div class="subtitle">Applications</div>
    </div>

    <!-- 子应用列表容器 -->
    <div class="list">
      <!-- 空状态 -->
      <EmptyState v-if="!applications.length" title="暂无子应用" />
      <!-- 列表项：遍历 applications -->
      <ScrollArea v-else>
        <Button
          v-for="app in applications"
          :key="itemKey(app)"
          variant="subtle"
          block
          class="item"
          @click="selectApp(app)"
        >
          <!-- 应用显示名（优先 displayName，其次 name） -->
          <div class="itemTitle">{{ app.displayName || app.name }}</div>
          <!-- 应用原始名称 -->
          <div class="itemMeta">
            <span class="itemName">{{ app.name }}</span>
          </div>
        </Button>
      </ScrollArea>
    </div>

    <!-- 本层数据分组 -->
    <div class="headerSecondary">
      <div class="title">本层数据</div>
      <div class="subtitle">Base</div>
    </div>

    <!-- 本层数据列表 -->
    <div class="list">
      <!-- 空状态 -->
      <EmptyState v-if="!baseGroups.length" title="暂无数据" />
      <!-- 列表项 -->
      <ScrollArea v-else>
        <Button
          v-for="group in baseGroups"
          :key="group.key"
          variant="subtle"
          block
          class="item"
          @click="selectBase(group.key)"
        >
          <!-- 分组 key 名称 -->
          <div class="itemTitle">{{ group.key }}</div>
        </Button>
      </ScrollArea>
    </div>
  </div>
</template>

<style scoped>
/* 面板容器：纵向 flex 布局，填满父容器高度 */
.panel {
  display: flex; /* flex 布局 */
  flex-direction: column; /* 纵向排列 */
  height: 100%; /* 填满父容器 */
  overflow: hidden; /* 隐藏溢出 */
  background: var(--glass); /* 毛玻璃背景 */
  border: 1px solid var(--glass-brd); /* 毛玻璃边框 */
}

/* 区域标题容器 */
.header {
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-sm)
    var(--spacing-lg); /* 上右下左内边距 */
  display: flex; /* flex 布局 */
  flex-direction: column; /* 纵向排列 */
  gap: 2px; /* 标题与副标题间距 */
  flex-shrink: 0; /* 不收缩 */
}

/* 第二个标题区域（带顶部分隔线） */
.headerSecondary {
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-sm)
    var(--spacing-lg); /* 内边距 */
  display: flex; /* flex */
  flex-direction: column; /* 纵向 */
  gap: 2px; /* 间距 */
  flex-shrink: 0; /* 不收缩 */
  border-top: 1px solid var(--glass-brd); /* 顶部分隔 */
}

/* 标题文字 */
.title {
  font-size: var(--text-base); /* 基础字号 */
  font-weight: 600; /* 加粗 */
  color: var(--text); /* 主文字色 */
}

/* 副标题文字 */
.subtitle {
  font-size: var(--text-xs); /* 小字号 */
  color: var(--muted); /* 弱文字色 */
}

/* 列表容器：flex-grow 占满剩余空间，内部 ScrollArea 接管滚动 */
.list {
  display: flex; /* flex */
  flex-direction: column; /* 纵向 */
  gap: 4px; /* 项间距 */
  padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-lg)
    var(--spacing-sm); /* 内边距 */
  flex: 1; /* 占剩余空间 */
  min-height: 0; /* 允许收缩 */

}

/* 列表项按钮：基于 .btn.subtle + .btn.block，仅覆盖间距和颜色 */
.item {
  margin-top: 0.5rem;
  gap: 2px; /* 比 .btn 默认间距更紧凑 */
  padding: var(--spacing-sm) var(--spacing-md); /* 列表项内边距 */
}

/* 项标题 */
.itemTitle {
  font-size: var(--text-sm); /* 小字号 */
  font-weight: 600; /* 加粗 */
  color: var(--text); /* 主文字色 */
  overflow: hidden; /* 隐藏溢出 */
  text-overflow: ellipsis; /* 省略号 */
  white-space: nowrap; /* 不换行 */
}

/* 项元数据区 */
.itemMeta {
  display: flex; /* flex */
  justify-content: space-between; /* 两端对齐 */
  font-size: var(--text-xs); /* 极小字号 */
  color: var(--muted); /* 弱文字色 */
}
</style>
