<script setup lang="ts">
// AdminPage — 后台管理页面主体
// 两栏布局：左侧面板（子应用列表/数据分组） + 中间内容区（数据表格）
// 页面进入时自动检查登录态 → 已登录则自动获取根层级数据
import { ref, onMounted } from 'vue' // Vue 响应式 API
import { createLogger } from '@/utils/logger' // 项目日志体系
import { EmptyState, Skeleton } from '@/components/common' // 通用组件
import { toast } from '@/composables/useToast' // Toast 通知
import { useNocoBaseAuthStore } from '@/stores/NocoBaseAuth' // NocoBase 认证 store
import { nocoBaseService } from '@/services/NocoBase/client' // 客户端单例
import { getAllAvailableNocoBaseInfo } from '@/services/NocoBase/data/info' // 根层级探测
// 子组件
import LeftPanel from '@/views/AdminPage/LeftPanel.vue'
import MainContent from '@/views/AdminPage/MainContent.vue'

// 创建 logger 实例
const log = createLogger('AdminPage.vue', 'AdminPage')
// NocoBase 认证 store（提取到 script 中，避免模板内调用）
const authStore = useNocoBaseAuthStore()

// =====================
// 响应式状态
// =====================

// 根层级探测结果
const info = ref<{
  data?: Record<string, unknown>
  errors?: Record<string, unknown>
} | null>(null)
// 当前选中的本层数据 key
const selectedBaseKey = ref<string | null>(null)
// 当前选中的子应用
const selectedApp = ref<Record<string, unknown> | null>(null)
// 数据加载中
const isLoading = ref<boolean>(false)
// 加载错误信息
const loadError = ref<string>('')

// =====================
// 数据获取
// =====================

// 刷新根层级数据
async function refresh(): Promise<void> {
  log.info('刷新根层级数据')
  isLoading.value = true
  loadError.value = '' // 清空之前的错误

  try {
    // 调用根层级探测
    const result = await getAllAvailableNocoBaseInfo()
    // 更新数据
    info.value = result as {
      data?: Record<string, unknown>
      errors?: Record<string, unknown>
    } | null
    log.info('根层级数据已更新', { hasData: !!result })
  } catch (error: unknown) {
    // 请求失败
    const err = error as { message?: string }
    log.error('获取根层级数据失败', { error: err?.message })
    loadError.value = err?.message || '未知错误'
    toast('获取数据失败: ' + (err?.message || '未知错误'), 'error')
  } finally {
    isLoading.value = false
  }
}

// =====================
// 左侧面板选择事件
// =====================

// 选中本层数据分组
const handleSelectBase = (key: string): void => {
  // 设置选中的 key，同时清空子应用选中
  selectedBaseKey.value = key
  selectedApp.value = null
}

// 选中子应用
const handleSelectApp = (app: Record<string, unknown>): void => {
  // 设置选中的子应用，同时清空本层选中
  selectedApp.value = app
  selectedBaseKey.value = null
}

// =====================
// 页面生命周期
// =====================

onMounted(async (): Promise<void> => {
  // 设置页面标题
  document.title = '后台管理 - RegionAI'
  log.info('进入后台管理页')

  // 检查认证状态（复用顶部已声明的 authStore）
  if (!authStore.isLoggedIn) {
    // 未登录 → 不发起请求，UI 层展示空状态
    log.warn('未登录，无法获取数据')
    return
  }

  // 确保客户端已创建（如果 store 有 token 但客户端尚未创建）
  if (!nocoBaseService.peekAuthedClient()) {
    // 用 store 中的 token 创建客户端
    nocoBaseService.createClient(authStore.token!, authStore.baseURL!)
  }

  // 自动获取根层级数据
  await refresh()
})
</script>

<template>
  <!-- 页面根容器：两栏布局 -->
  <div class="container">
    <!-- ===================== -->
    <!-- 左侧面板 -->
    <!-- ===================== -->
    <div class="left">
      <LeftPanel
        :info="info"
        @select-base="handleSelectBase"
        @select-app="handleSelectApp"
      />
    </div>

    <!-- ===================== -->
    <!-- 中间内容区 -->
    <!-- ===================== -->
    <div class="middle">
      <!-- 未登录状态 -->
      <div v-if="!authStore.isLoggedIn" class="centerState">
        <EmptyState
          title="请先登录"
          description="在登录页面完成 NocoBase 认证后即可查看数据"
        />
      </div>

      <!-- 加载中 -->
      <div v-else-if="isLoading" class="centerState">
        <Skeleton variant="text" :count="6" />
      </div>

      <!-- 加载错误 -->
      <div v-else-if="loadError" class="centerState">
        <EmptyState title="数据获取失败" :description="loadError" />
      </div>

      <!-- 正常内容 -->
      <MainContent
        v-else
        :info="info"
        :selected-base-key="selectedBaseKey"
        :selected-app="selectedApp"
        @refresh="refresh"
      />
    </div>
  </div>
</template>

<style scoped>
/* 页面根容器：横向 flex，填满 .app-content */
.container {
  display: flex; /* 横向 flex */
  flex-direction: row; /* 横排 */
  height: 100%; /* 填满父容器 */
  min-height: 0; /* 允许收缩 */
  gap: var(--spacing-sm); /* 两栏间距 */
  padding: var(--spacing-sm); /* 整体内边距 */
}

/* 左侧面板：固定宽度 */
.left {
  flex: 0 0 260px; /* 不伸缩，固定 260px */
  max-width: 260px; /* 最大宽度 */
  min-width: 0; /* 允许内部收缩 */
  border-radius: var(--radius-lg); /* 大圆角 */
  overflow: hidden; /* 裁剪溢出 */
}

/* 中间内容区：占满剩余空间 */
.middle {
  flex: 1 1 auto; /* 可伸缩 */
  min-width: 0; /* 允许内部收缩 */
  border-radius: var(--radius-lg); /* 大圆角 */
  overflow: hidden; /* 裁剪溢出 */
}

/* 居中状态容器 */
.centerState {
  height: 100%; /* 填满 */
  display: flex; /* flex */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  background: var(--glass); /* 毛玻璃背景 */
  border: 1px solid var(--glass-brd); /* 边框 */
  border-radius: var(--radius-lg); /* 圆角 */
}
</style>
