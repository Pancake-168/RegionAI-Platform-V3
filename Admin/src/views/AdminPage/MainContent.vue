<script setup lang="ts">
// MainContent — 后台管理页面的中间内容区
// 负责展示 NocoBase 数据：根层级数据（JSON 视图）、子应用数据（表格）
// 包含三级缓存（appInfo/table）+ 三级 Promise inFlight 去重
import { computed, h, ref, watch } from 'vue' // Vue 响应式 API
import { Icon } from '@iconify/vue'
import { createLogger } from '@/utils/logger' // 项目日志体系
import {
  Button,
  Confirm,
  ContextMenu,
  Dialog,
  EmptyState,
  IconContainer,
  Input,
  ScrollArea,
  Select,
  Skeleton,
} from '@/components/common' // 通用组件
import type { MenuItem, SelectOption } from '@/components/common/types' // Select 选项类型
import { toast } from '@/composables/useToast' // Toast 通知函数
// 服务层函数
import {
  getAllAvailableNocoBaseInfoByApplication,
  getCollectionDataByApplication,
} from '@/services/NocoBase/data/info'
import { register } from '@/services/Project/SSO/LoginOrRegister'
import { getTokenByUsername, getAllAccountTypes } from '@/services/Project/SSO/CopyToken'
import { ListContainers, StartContainer, StopContainer, RestartContainer, GetContainerLogs } from '@/services/Project/Watchtower'

// 创建 logger 实例
const log = createLogger('MainContent.vue', 'MainContent')

// =====================
// 类型定义
// =====================

// 探测结果类型
type InfoPayload = {
  data?: Record<string, unknown>
  attempts?: Record<string, unknown>
}

// =====================
// Props
// =====================

const props = defineProps<{
  info: InfoPayload | null // 父组件传入的根层级探测结果
  selectedBaseKey: string | null // 当前选中的本层数据 key（如 'users'）
  selectedApp: Record<string, unknown> | null // 当前选中的子应用对象
}>()

// =====================
// Emits
// =====================

const emit = defineEmits<{
  // 刷新根层级数据
  (event: 'refresh'): void
}>()

// =====================
// 响应式状态
// =====================

// 当前选中的 collection 名称
const selectedCollection = ref<string>('')
// 当前子应用的探测结果
const appInfo = ref<InfoPayload | null>(null)
// 加载状态
const appLoading = ref<boolean>(false) // 子应用数据加载中
const tableLoading = ref<boolean>(false) // 表格数据加载中

// 当前 collection 的表格数据行
const appTableRows = ref<Array<Record<string, unknown>>>([])

const botUsernames = ref<Set<string>>(new Set())
const containerStatuses = ref<Record<string, string>>({})

// =====================
// 三级缓存 + 三级 inFlight 去重
// =====================

// Map 缓存：key → 已获取的数据，命中后直接返回不发起请求
const appInfoCache = new Map<string, InfoPayload>() // 子应用探测结果缓存
const tableCache = new Map<string, Array<Record<string, unknown>>>() // collection 数据缓存

// Promise 去重：同一 key 正在请求中时复用已有 Promise，避免并发重复请求
const appInfoInFlight = new Map<string, Promise<InfoPayload | null>>() // 子应用探测 inFlight
const tableInFlight = new Map<string, Promise<Array<Record<string, unknown>>>>() // collection inFlight

// =====================
// 派生数据
// =====================

// 根层级 baseData
const baseData = computed<Record<string, unknown>>(
  () => (props.info?.data as Record<string, unknown>) ?? {},
)

// 当前子应用的 collections 列表（原始格式）
const appCollections = computed<Array<Record<string, unknown>>>(() => {
  // 从探测结果中提取 preferred 数据
  const data = pickPreferredAttempts(appInfo.value?.attempts)
  // 取 collections 字段，是数组则返回
  return Array.isArray(data?.collections)
    ? (data.collections as Array<Record<string, unknown>>)
    : []
})

// 当前表格数据行：子应用模式取 collection 数据；本层模式取 selectedBaseKey 对应的数组
const rows = computed<Array<Record<string, unknown>>>(() => {
  // 子应用模式
  let list: Array<Record<string, unknown>> = []
  if (props.selectedApp) {
    list = Array.isArray(appTableRows.value) ? appTableRows.value : []
  } else if (props.selectedBaseKey) {
    // 本层模式
    const data = baseData.value[props.selectedBaseKey]
    list = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : []
  }
  // users 表下隐藏 id=1 的系统账号
  if (selectedCollection.value === 'users') {
    list = list.filter((row) => row.id !== 1)
  }
  return list
})

// 表格中需要隐藏的系统字段
const HIDDEN_COLUMNS = new Set([
  'createdAt',
  'updatedAt',
  'createdById',
  'updatedById',
  'expires_at',
  'issued_at'
])

// 动态列：从所有行数据中提取唯一的 key 集合作为表头，排除系统字段
const columns = computed<string[]>(() => {
  // 无数据则无列
  if (!rows.value.length) return []
  // 用 Set 收集所有行中出现的 key
  const colSet = new Set<string>()
  rows.value.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (!HIDDEN_COLUMNS.has(key)) colSet.add(key)
    })
  })
  // 转数组返回
  return Array.from(colSet)
})

// 当前选中的是否是 users 表
const isOtherAppUsersTable = computed<boolean>(
  () => selectedCollection.value === 'users' &&  props.selectedApp?.name !== 'A_SYSTEM_APPLICATION' ,
)

// collections 的 Select 选项（仅渲染 users 表）
const collectionSelectOptions = computed<SelectOption[]>(() =>
  appCollections.value
   .filter((col) => col.name === 'users')
    .map((col) => ({
      value: col.name as string, // option 值
      label: col.name as string, // option 显示文本
    })),
)

// =====================
// 工具函数
// =====================

// 从 attempts 中选择 preferred 数据：appHeader.data > appParam.data > appPath.data > {}
const pickPreferredAttempts = (attempts: unknown): Record<string, unknown> => {
  const a = attempts as Record<string, { data?: unknown }> | null | undefined
  return (a?.appHeader?.data ??
    a?.appParam?.data ??
    a?.appPath?.data ??
    {}) as Record<string, unknown>
}

// 从各种响应格式中提取数组
/*
const getListData = (payload: unknown): Array<Record<string, unknown>> => {
  // 本身就是数组
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>
  // { data: [...] } 包裹
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as Record<string, unknown>).data)
  )
    return (payload as Record<string, unknown>).data as Array<
      Record<string, unknown>
    >
  // 其他 → 空数组
  return []
}
*/


// 格式化单元格值：null/undefined → 空字符串，object → JSON，其他 → 字符串
const formatCell = (value: unknown): string => {
  // null 或 undefined
  if (value === null || value === undefined) return ''
  // 对象类型 → JSON 序列化
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  // 其他类型 → 字符串
  return String(value)
}

// 获取行的唯一 key
const rowKey = (row: Record<string, unknown>, index: number): string =>
  String(row?.id ?? row?.key ?? index)

// =====================
// 注册功能
// =====================

const registerDialogOpen = ref<boolean>(false)
const registerUsername = ref<string>('')
const registerPassword = ref<string>('')
const registerConfirmPassword = ref<string>('')
const registerLoading = ref<boolean>(false)

// 账号校验：不能含大写字母，不能为空
const registerUsernameError = computed<string>(() => {
  const val = registerUsername.value
  if (!val) return ''
  if (/[A-Z]/.test(val)) return '账号不能包含大写字母'
  return ''
})

// 确认密码校验
const registerConfirmError = computed<string>(() => {
  if (!registerConfirmPassword.value) return ''
  if (registerConfirmPassword.value !== registerPassword.value)
    return '两次输入的密码不一致'
  return ''
})

// 注册按钮是否可提交
const registerCanSubmit = computed<boolean>(() => {
  const username = registerUsername.value.trim()
  const password = registerPassword.value
  const confirm = registerConfirmPassword.value
  return (
    username.length > 0 &&
    !/[A-Z]/.test(username) &&
    password.length > 0 &&
    password === confirm
  )
})

// 打开注册弹窗
const openRegisterDialog = (): void => {
  registerUsername.value = ''
  registerPassword.value = ''
  registerConfirmPassword.value = ''
  registerDialogOpen.value = true
}

// 提交注册
const handleRegister = async (): Promise<void> => {
  if (!registerCanSubmit.value) return
  registerLoading.value = true
  const result = await register(
    registerUsername.value.trim(),
    registerPassword.value,
  )
  registerLoading.value = false
  if (result.ok) {
    toast('注册成功', 'success')
    registerDialogOpen.value = false
  } else {
    toast(result.error || '注册失败', 'error')
  }
}

// =====================
// 事件处理
// =====================

// 刷新根层级数据
const refresh = (): void => {
  log.info('刷新数据')
  emit('refresh')
}

// 复制用户 token
const copyToken = async (row: Record<string, unknown>): Promise<void> => {
  const username = row.username as string | undefined
  if (!username) {
    toast('该记录缺少 username 字段', 'error')
    return
  }
  const result = await getTokenByUsername(username)
  if (!result.ok) {
    toast(result.error || '获取 token 失败', 'error')
    return
  }
  await navigator.clipboard.writeText(result.data)
  toast('token 已复制', 'success')
}

// Bot 标签：切到其他应用 users 表时拉取 bot 列表和容器状态
watch(isOtherAppUsersTable, async (isUsers) => {
  if (!isUsers) { botUsernames.value = new Set(); containerStatuses.value = {}; return }
  const r = await getAllAccountTypes()
  if (r.ok && r.data) {
    const s = new Set<string>()
    for (const [u, t] of Object.entries(r.data)) { if (t === 'bot') s.add(u) }
    botUsernames.value = s
  }
  await refreshContainerStatuses()
})

// =====================
// 右键菜单：bot 容器操作
// =====================

const confirmOpen = ref(false)
const confirmAction = ref<'' | 'start' | 'stop' | 'restart'>('')
const confirmTarget = ref<Record<string, unknown> | null>(null)

// 日志弹窗
const logDialogOpen = ref(false)
const logTargetName = ref('')
const logContent = ref('')
const logLoading = ref(false)

const confirmLabels: Record<string, string> = {
  start: '启动',
  stop: '停止',
  restart: '重启',
}

const botMenuItems = (row: Record<string, unknown>): MenuItem[] => [
  {
    label: '启动',
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:debug-start', width: 14 })),
    onClick: () => openConfirm('start', row),
  },
  {
    label: '停止',
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:debug-stop', width: 14 })),
    onClick: () => openConfirm('stop', row),
  },
  {
    label: '重启',
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:debug-restart', width: 14 })),
    onClick: () => openConfirm('restart', row),
  },
  { label: '', separator: true },
  {
    label: '获取日志',
    icon: h(IconContainer, { size: 14 }, () => h(Icon, { icon: 'codicon:output', width: 14 })),
    onClick: () => openLogDialog(row),
  },
]

async function openLogDialog(row: Record<string, unknown>) {
  const username = row.username as string
  logTargetName.value = username
  logDialogOpen.value = true
  logContent.value = ''
  logLoading.value = true
  const r = await getTokenByUsername(username)
  if (!r.ok) { toast(r.error || '获取 token 失败', 'error'); logLoading.value = false; return }
  const res = await GetContainerLogs(r.data, username)
  logLoading.value = false
  if (res.ok && res.data) {
    logContent.value = res.data.logs
  } else {
    toast(res.error || '获取日志失败', 'error')
  }
}

function openConfirm(action: 'start' | 'stop' | 'restart', row: Record<string, unknown>) {
  confirmAction.value = action
  confirmTarget.value = row
  confirmOpen.value = true
}

async function handleContainerAction() {
  if (!confirmTarget.value) return
  const username = confirmTarget.value.username as string
  const r = await getTokenByUsername(username)
  if (!r.ok) { toast(r.error || '获取 token 失败', 'error'); return }
  const token = r.data
  let result: { ok: boolean; error?: string }
  switch (confirmAction.value) {
    case 'start': result = await StartContainer(token, username); break
    case 'stop': result = await StopContainer(token, username); break
    case 'restart': result = await RestartContainer(token, username); break
    default: return
  }
  confirmOpen.value = false
  if (result.ok) {
    toast(`${confirmLabels[confirmAction.value]}成功`, 'success')
    setTimeout(refreshContainerStatuses, 1500)
  } else {
    toast(result.error || '操作失败', 'error')
  }
}

async function refreshContainerStatuses() {
  const c = await ListContainers()
  log.info('刷新容器状态', { ok: c.ok, total: c.ok ? c.data?.total : 0 })
  if (c.ok && c.data) {
    const map: Record<string, string> = {}
    for (const item of c.data.containers) {
      const uname = item.name?.replace(/^shayu-/, '')
      if (uname) map[uname] = item.status
    }
    containerStatuses.value = map
  }
}

// =====================
// Watchers：选中子应用变化 → 获取子应用探测数据
// =====================

watch(
  () => props.selectedApp, // 监听 selectedApp 变化
  async (app) => {
    // 清空之前的状态
    selectedCollection.value = '' // 清空选中的 collection
    appTableRows.value = [] // 清空表格数据

    // 无 app → 清空 appInfo
    if (!app?.name) {
      appInfo.value = null
      return
    }

    const appName = app.name as string
    log.info('切换子应用', { appName })

    // 1. 检查缓存
    const cached = appInfoCache.get(appName)
    if (cached) {
      log.info('appInfo 缓存命中', { appName })
      appInfo.value = cached
      return
    }

    // 2. 检查 inFlight
    if (appInfoInFlight.has(appName)) {
      log.info('appInfo inFlight 去重', { appName })
      appInfo.value = await appInfoInFlight.get(appName)!
      return
    }

    // 3. 发起请求
    appLoading.value = true
    const task = getAllAvailableNocoBaseInfoByApplication(appName)
    // 设置 inFlight
    appInfoInFlight.set(appName, task)
    const result = await task
    // 清除 inFlight
    appInfoInFlight.delete(appName)
    appLoading.value = false
    // 存入缓存
    if (result) {
      appInfoCache.set(appName, result as InfoPayload)
    }
    appInfo.value = (result as InfoPayload) || null
  },
  { immediate: true }, // 首次也执行
)

// =====================
// Watchers：选中 collection 变化 → 获取 collection 数据
// =====================

watch(
  () => selectedCollection.value, // 监听选中的 collection
  async (collection) => {
    // 清空之前的表格数据
    appTableRows.value = []
    // collection 为空或无子应用 → 跳过
    if (!collection || !props.selectedApp?.name) return

    const appName = props.selectedApp.name as string
    const cacheKey = `${appName}:${collection}` // 缓存 key：appName:collectionName
    log.info('切换数据表', { appName, collection })

    // 1. 检查缓存
    const cached = tableCache.get(cacheKey)
    if (cached) {
      log.info('Table 缓存命中', { cacheKey })
      appTableRows.value = cached
      return
    }

    // 2. 检查 inFlight
    if (tableInFlight.has(cacheKey)) {
      log.info('Table inFlight 去重', { cacheKey })
      appTableRows.value = (await tableInFlight.get(cacheKey)!) || []
      return
    }

    // 3. 发起请求
    tableLoading.value = true
    const task = (async (): Promise<Array<Record<string, unknown>>> => {
      // 调用 collection 查询
      const response = await getCollectionDataByApplication(
        appName,
        collection,
        {
          page: 1, // 第 1 页
          pageSize: 50, // 每页 50 条
        },
      )
      // 提取数据
      const data = pickPreferredAttempts(response?.attempts)
      const list = Array.isArray(data)
        ? data
        : (((data as Record<string, unknown>)?.data ?? []) as Array<
            Record<string, unknown>
          >)
      // 存入缓存
      tableCache.set(cacheKey, list)
      return list
    })()

    // 设置 inFlight
    tableInFlight.set(cacheKey, task)
    const list = await task
    // 清除 inFlight
    tableInFlight.delete(cacheKey)
    tableLoading.value = false
    // 更新表格数据
    appTableRows.value = list
  },
)
</script>

<template>
  <!-- 中间内容区根容器 -->
  <div class="panel" @contextmenu.prevent>
    <!-- ===================== -->
    <!-- 工具栏 -->
    <!-- ===================== -->
    <div class="toolbar">
      <!-- 当前应用名 -->
      <div class="info">
        当前组织：<span v-if="selectedApp">{{
          selectedApp.displayName || selectedApp.name
        }}</span>
        <span v-else class="muted">未选择</span>
      </div>

      <!-- 刷新按钮 -->
      <Button variant="subtle" @click="refresh">刷新数据</Button>

      <!-- 注册按钮 -->
      <Button variant="primary" @click="openRegisterDialog">注册</Button>
    </div>

    <!-- ===================== -->
    <!-- Collection 选择器（子应用模式） -->
    <!-- ===================== -->
    <div v-if="selectedApp" class="collectionBar">
      <Select
        v-model="selectedCollection"
        :options="collectionSelectOptions"
        placeholder="选择数据表"
      />
    </div>

    <!-- ===================== -->
    <!-- 数据表格视图 -->
    <!-- ===================== -->
    <div v-if="rows.length" class="tableWrap">
      <ScrollArea>
        <table class="dataTable">
          <thead>
            <tr>
              <!-- users 表：操作列 -->
              <th v-if="isOtherAppUsersTable" class="actionCol">操作</th>
              <!-- 动态表头列 -->
              <th v-for="col in columns" :key="col">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <!-- 数据行 -->
            <tr v-for="(row, rowIndex) in rows" :key="rowKey(row, rowIndex)">
              <!-- users 表：复制 token 按钮 + bot 标签 -->
              <td v-if="isOtherAppUsersTable" class="actionCol">
                <ContextMenu
                  :items="botMenuItems(row)"
                  :disabled="!botUsernames.has(row.username as string)"
                >
                  <span class="actionRow">
                <Button variant="subtle" @click="copyToken(row)">
                  <template #icon>
                    <IconContainer :size="14">
                      <Icon icon="codicon:copy" :width="14" />
                    </IconContainer>
                  </template>
                  复制token
                </Button>
                <Button v-if="botUsernames.has(row.username as string)" variant="secondary" disabled>bot</Button>
                <span
                  v-if="containerStatuses[row.username as string]"
                  class="statusDot"
                  :class="containerStatuses[row.username as string] === 'running' ? 'statusRunning' : 'statusStopped'"
                ></span>
                <span
                  v-if="containerStatuses[row.username as string]"
                  class="statusText"
                >{{ containerStatuses[row.username as string] }}</span>
                </span>
                </ContextMenu>
              </td>
              <td v-for="col in columns" :key="col">
                <div class="cellContent">{{ formatCell(row[col]) }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </ScrollArea>
    </div>

    <!-- ===================== -->
    <!-- 加载/空状态 -->
    <!-- ===================== -->
    <div v-else-if="tableLoading" class="centerState">
      <Skeleton variant="text" :count="8" />
    </div>
    <div v-else-if="appLoading" class="centerState">
      <Skeleton variant="text" :count="5" />
    </div>
    <div v-else class="centerState">
      <EmptyState
        title="请选择数据项查看详情"
        description="从左侧面板选择组织或本层数据分组"
      />
    </div>
  </div>

  <!-- ===================== -->
  <!-- 容器操作确认弹窗 -->
  <!-- ===================== -->
  <Confirm
    :open="confirmOpen"
    :title="`确认${confirmLabels[confirmAction]}容器`"
    :description="`确定要${confirmLabels[confirmAction]} Bot「${confirmTarget?.username}」的容器吗？`"
    :confirm-label="confirmLabels[confirmAction]"
    @update:open="confirmOpen = $event"
    @confirm="handleContainerAction"
  />

  <!-- ===================== -->
  <!-- 容器日志弹窗 -->
  <!-- ===================== -->
  <Dialog
    :open="logDialogOpen"
    :title="`容器日志 - ${logTargetName}`"
    @update:open="logDialogOpen = $event"
  >
    <div v-if="logLoading" class="centerState">
      <Skeleton variant="text" :count="10" />
    </div>
    <div v-else class="logWrapper">
      <ScrollArea :max-height="400">
        <pre class="logPre">{{ logContent || '暂无日志' }}</pre>
      </ScrollArea>
    </div>
    <div v-if="!logLoading" class="logActions">
      <Button variant="subtle" @click="openLogDialog({ username: logTargetName })">
        <template #icon>
          <IconContainer :size="14">
            <Icon icon="codicon:refresh" :width="14" />
          </IconContainer>
        </template>
        刷新
      </Button>
    </div>
  </Dialog>

  <!-- ===================== -->
  <!-- 注册弹窗 -->
  <!-- ===================== -->
  <Dialog
    :open="registerDialogOpen"
    title="注册新账号"
    description="注册后可在 SSO 统一认证系统中使用"
    @update:open="registerDialogOpen = $event"
  >
    <div class="registerForm">
      <Input
        v-model="registerUsername"
        label="账号"
        placeholder="小写字母、数字、特殊字符"
        :error="registerUsernameError"
      />
      <Input
        v-model="registerPassword"
        label="密码"
        type="password"
        placeholder="请输入密码"
      />
      <Input
        v-model="registerConfirmPassword"
        label="确认密码"
        type="password"
        placeholder="请再次输入密码"
        :error="registerConfirmError"
      />
      <Button
        variant="primary"
        block
        :disabled="!registerCanSubmit"
        :loading="registerLoading"
        @click="handleRegister"
      >
        注册
      </Button>
    </div>
  </Dialog>
</template>

<style scoped>
/* 面板根容器 */
.panel {
  display: flex; /* flex */
  flex-direction: column; /* 纵向 */
  height: 100%; /* 填满 */
  overflow: hidden; /* 隐藏溢出 */
  background: var(--glass); /* 毛玻璃背景 */
  border: 1px solid var(--glass-brd); /* 边框 */
}

/* 工具栏 */
.toolbar {
  display: flex; /* flex */
  align-items: center; /* 垂直居中 */
  gap: var(--spacing-md); /* 元素间距 */
  padding: var(--spacing-lg); /* 内边距 */
  border-bottom: 1px solid var(--glass-brd); /* 底部分隔 */
  flex-shrink: 0; /* 不收缩 */
}

/* 当前应用名 */
.info {
  flex: 1; /* 占满剩余空间 */
  font-size: var(--text-sm); /* 小字号 */
  color: var(--text); /* 主文字色 */
}

/* 弱文字 */
.muted {
  color: var(--muted); /* 弱文字色 */
}

/* Collection 选择栏 */
.collectionBar {
  padding: var(--spacing-sm) var(--spacing-lg); /* 内边距 */
  border-bottom: 1px solid var(--glass-brd); /* 底部分隔 */
  flex-shrink: 0; /* 不收缩 */
}

/* 表格包裹容器 */
.tableWrap {
  flex: 1; /* 占剩余空间 */
  min-height: 0; /* 允许收缩 */
  padding: var(--spacing-lg); /* 内边距 */
}

/* 数据表格 */
.dataTable {
  width: max-content; /* 内容撑开 */
  min-width: 100%; /* 至少填满 */
  border-collapse: collapse; /* 合并边框 */
  font-size: var(--text-sm); /* 小字号 */
}

/* 表头/单元格 */
.dataTable th,
.dataTable td {
  padding: var(--spacing-sm) var(--spacing-md); /* 内边距 */
  border-bottom: 1px solid var(--glass-brd); /* 底边框 */
  text-align: left; /* 左对齐 */
  color: var(--text); /* 文字色 */
  vertical-align: middle; /* 垂直居中 */
  white-space: nowrap; /* 不换行 */
}

/* 表头 */
.dataTable th {
  background: var(--input-bg); /* 输入框背景 */
  position: sticky; /* 粘性定位 */
  top: 0; /* 顶部吸顶 */
  font-weight: 600; /* 加粗 */
}

/* 偶数行 */
.dataTable tbody tr:nth-child(even) {
  background: var(--table-stripe); /* 表格斑马纹 */
}

/* 单元格内容：限宽 + 横向滚动 */
.cellContent {
  display: block; /* 块 */
  max-width: 300px; /* 最大宽度 */
  overflow-x: auto; /* 横向滚动 */
  white-space: nowrap; /* 不换行 */
}

/* 操作列 */
.actionCol {
  width: 1%;
  white-space: nowrap;
}

.actionRow {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: default;
}

/* 容器状态指示点 */
.statusDot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-left: var(--spacing-sm);
  border-radius: 50%;
  vertical-align: middle;
}
.statusRunning {
  background: var(--color-success);
}
.statusStopped {
  background: var(--color-error);
}
.statusText {
  margin-left: 2px;
  font-size: var(--text-xs);
  color: var(--muted);
  vertical-align: middle;
}

/* JSON 视图 */
.jsonViewer {
  flex: 1; /* 占满空间 */
  min-height: 0; /* 允许收缩 */
  padding: var(--spacing-lg); /* 内边距 */
}

/* JSON 预格式化文本 */
.jsonPre {
  margin: 0; /* 无外边距 */
  font-family: var(--font-mono); /* 等宽字体 */
  font-size: var(--text-sm); /* 小字号 */
  color: var(--text); /* 主文字色 */
  white-space: pre-wrap; /* 保留换行 + 自动换行 */
  word-break: break-word; /* 长单词断行 */
}

/* 居中状态（加载、空状态） */
.centerState {
  flex: 1; /* 占满空间 */
  display: flex; /* flex */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  padding: var(--spacing-2xl); /* 大内边距 */
}

/* 加载文字 */
.loading {
  padding: var(--spacing-2xl); /* 内边距 */
  text-align: center; /* 居中 */
  color: var(--muted); /* 弱文字色 */
  font-size: var(--text-sm); /* 小字号 */
}

/* 注册表单 */
.registerForm {
  display: flex; /* flex */
  flex-direction: column; /* 纵向 */
  gap: var(--spacing-lg); /* 字段间距 */
}

/* 日志弹窗 */
.logPre {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
}
.logActions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-md);
}

.logWrapper {
  min-width: 800px;
}
</style>
