<template>
  <!-- 登录页外层容器：居中全屏布局 -->
  <div class="login-page">
    <!-- 登录卡片：毛玻璃面板 -->
    <div class="login-card">
      <!-- 标题 -->
      <h1 class="login-title">RegionAI管理后台</h1>

      <!-- 区域 1：三个服务器地址输入框（公网手动输入，无扫描） -->
      <div class="manual-config">
        <!-- API 后端地址 -->
        <div class="form-group">
          <Input
            v-model="apiBaseUrl"
            placeholder="API 地址 (http://x.x.x.x:端口)"
            :error="apiBaseError"
            @blur="validateAndPersist('api')"
          />
        </div>
        <!-- IM / Matrix 服务器地址 -->
        <div class="form-group">
          <Input
            v-model="matrixUrl"
            placeholder="IM 地址 (http://x.x.x.x:端口)"
          />
        </div>
        <!-- NocoBase / DB 服务器地址 -->
        <div class="form-group">
          <Input
            v-model="nocobaseUrl"
            placeholder="DB 地址 (http://x.x.x.x:端口)"
            :error="nocobaseUrlError"
            @blur="validateAndPersist('nocobase')"
          />
        </div>
      </div>

      <!-- 区域 3：NocoBase 账号 -->
      <div class="form-group">
        <Input v-model="username" placeholder="请输入账号" />
      </div>
      <!-- NocoBase 密码 -->
      <div class="form-group">
        <Input
          v-model="password"
          type="password"
          placeholder="请输入密码"
          @keyup.enter="handleLogin"
        />
      </div>

      <!-- 错误提示：红色背景文字 -->
      <div v-if="errorMessage" class="login-error">{{ errorMessage }}</div>

      <!-- 登录按钮：项目通用 Button 组件，支持 loading 态 -->
      <Button
        variant="primary"
        class="login-btn"
        :disabled="!canLogin"
        :loading="isLoggingIn"
        @click="handleLogin"
      >
        登录
      </Button>
    </div>

  </div>
</template>

<script setup lang="ts">
// ===== 框架和工具导入 =====
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Input, Button } from '@/components/common'
import { createLogger } from '@/utils/logger'
import { loginByAccount } from '@/services/NocoBase/url'
import { useNocoBaseAuthStore } from '@/stores/NocoBaseAuth'
import { SystemStorageManager } from '@/utils/SystemStorage'

/// 校验 URL 格式是否合法（必须以 http:// 或 https:// 开头）
function validateUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// ===== Logger =====
const loginLog = createLogger('LoginPage2.vue', 'handleLogin')
const applyLog = createLogger('LoginPage2.vue', 'persistServerUrls')

// ===== Router =====
const router = useRouter()

// ===== 服务器地址输入 =====
const apiBaseUrl = ref('')
const matrixUrl = ref('')
const nocobaseUrl = ref('')
const apiBaseError = ref('')
const nocobaseUrlError = ref('')

// ===== 登录凭据 =====
const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoggingIn = ref(false)

// ===== computed =====

/// 公网手动输入分支：校验 API 地址和 NocoBase 地址，Matrix 填不填不影响登录
const canLogin = computed(() => {
  return (
    validateUrl(apiBaseUrl.value) &&
    validateUrl(nocobaseUrl.value) &&
    username.value.trim() !== '' &&
    password.value.trim() !== ''
  )
})

// ===== 服务器地址持久化 =====

/// 校验 API 地址和 NocoBase 地址
function validateAndPersist(field: 'api' | 'nocobase') {
  if (field === 'api') {
    apiBaseError.value = validateUrl(apiBaseUrl.value)
      ? ''
      : '请输入有效的服务器地址（需包含 http://）'
  } else {
    nocobaseUrlError.value = validateUrl(nocobaseUrl.value)
      ? ''
      : '请输入有效的服务器地址（需包含 http://）'
  }
  void persistServerUrls()
}

/// 持久化地址：NocoBase 必须有效才写；API/Matrix 有值且有效才写
async function persistServerUrls() {
  const writes: Promise<boolean>[] = []

  if (validateUrl(nocobaseUrl.value)) {
    writes.push(SystemStorageManager.setServerNocobaseUrl(nocobaseUrl.value))
  }
  if (validateUrl(apiBaseUrl.value)) {
    writes.push(SystemStorageManager.setServerApiBaseUrl(apiBaseUrl.value))
  }
  if (validateUrl(matrixUrl.value)) {
    writes.push(SystemStorageManager.setServerMatrixUrl(matrixUrl.value))
  }

  await Promise.all(writes)
  applyLog.info('服务器地址已持久化', { nocobase: nocobaseUrl.value })
}

// ===== 登录流程 =====

/// 处理登录按钮点击
async function handleLogin() {
  if (isLoggingIn.value) return

  if (!validateUrl(apiBaseUrl.value)) {
    errorMessage.value = '请输入有效的 API 服务器地址'
    return
  }
  if (!validateUrl(nocobaseUrl.value)) {
    errorMessage.value = '请输入有效的 NocoBase 服务器地址'
    return
  }
  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = '请输入账号和密码'
    return
  }

  errorMessage.value = ''
  isLoggingIn.value = true
  const nocobaseApiUrl = nocobaseUrl.value.replace(/\/+$/, '') + '/api'

  try {
    loginLog.info('开始登录', {
      url: nocobaseApiUrl,
      username: username.value.trim(),
    })

    const client = await loginByAccount(
      nocobaseApiUrl,
      username.value.trim(),
      password.value.trim(),
    )
    if (!client) {
      errorMessage.value = '登录失败：账号或密码错误'
      loginLog.warn('登录失败', { url: nocobaseApiUrl })
      return
    }

    const token = client.auth.getToken?.() || ''
    if (!token) {
      errorMessage.value = '登录失败：未获取到认证令牌'
      loginLog.warn('登录返回的客户端中无 token')
      return
    }

    const authStore = useNocoBaseAuthStore()
    authStore.setAuth(String(token), nocobaseApiUrl)

    loginLog.info('登录成功，即将跳转', { url: nocobaseApiUrl })

    await router.push('/admin')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errorMessage.value = `登录失败：${message}`
    loginLog.error('登录异常', error)
  } finally {
    isLoggingIn.value = false
  }
}

// ===== 生命周期 =====

onMounted(async () => {
  // 从 localStorage 恢复上次手动输入的服务器地址
  const savedApi = await SystemStorageManager.getServerApiBaseUrl()
  const savedMatrix = await SystemStorageManager.getServerMatrixUrl()
  const savedNoco = await SystemStorageManager.getServerNocobaseUrl()
  if (savedApi) apiBaseUrl.value = savedApi
  if (savedMatrix) matrixUrl.value = savedMatrix
  if (savedNoco) nocobaseUrl.value = savedNoco
})
</script>

<style scoped>
/* ============================================================================
 * 登录页私有样式 — 全部使用 var(--xxx) Token，不写死颜色/圆角/阴影
 * ============================================================================ */

/* ---- 外层容器：居中布局 ---- */
.login-page {
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  width: 100%; /* 占满父容器宽度 */
  height: 100%; /* 占满父容器高度 */
  position: relative; /* 为齿轮绝对定位提供参考 */
}

/* ---- 登录卡片：毛玻璃深色面板 ---- */
.login-card {
  display: flex; /* Flex 列布局 */
  flex-direction: column; /* 垂直排列子元素 */
  width: 320px; /* 固定宽度 */
  padding: var(--spacing-2xl); /* 24px 内边距 */
  border-radius: var(--radius-xl); /* 12px 圆角 */
  background: var(--bg-elev); /* 暗色 #11141a / 亮色 #ffffff */
  border: 1px solid var(--border); /* 半透明边框 */
  box-shadow: var(--shadow-md); /* 中等阴影 */
  gap: var(--spacing-lg); /* 子元素间距 12px */
}

/* ---- 标题 ---- */
.login-title {
  margin: 0; /* 清除默认 margin */
  font-size: var(--text-md); /* 14px */
  font-weight: 600; /* 加粗 */
  color: var(--text); /* 主文字色 */
  text-align: center; /* 居中 */
}

/* ---- 表单组容器 ---- */
.form-group {
  display: flex; /* Flex 列布局 */
  flex-direction: column; /* label 在上 input 在下 */
  gap: var(--spacing-xs); /* 标签和输入框间距 4px */
}

/* ---- 登录错误提示 ---- */
.login-error {
  padding: var(--spacing-md) var(--spacing-lg); /* 8px 12px 内边距 */
  border-radius: var(--radius-sm); /* 6px 圆角 */
  background: rgba(var(--color-error-rgb), 0.1); /* 淡红色背景 */
  color: var(--color-error); /* 错误红色文字 */
  font-size: var(--text-sm); /* 12px */
  line-height: 1.5; /* 行高 */
}

/* ---- 登录按钮宽度 ---- */
.login-btn {
  width: 100%; /* 撑满卡片宽度 */
}

/* ---- 扫描状态区域 ---- */
.discover-status {
  display: flex; /* 水平排列 */
  align-items: center; /* 垂直居中 */
  gap: var(--spacing-sm); /* 元素间距 6px */
  padding: var(--spacing-md) var(--spacing-lg); /* 8px 12px */
  border-radius: var(--radius-sm); /* 6px 圆角 */
  background: var(--glass); /* 半透明玻璃背景 */
  border: 1px solid var(--glass-brd); /* 玻璃边框 */
}

.discover-status-icon {
  width: 10px; /* 小圆点 10px */
  height: 10px; /* 小圆点 10px */
  border-radius: var(--radius-full); /* 圆形 */
  flex-shrink: 0; /* 不缩放 */
}

/* 扫描中：蓝色旋转动画 */
.discover-status-icon--scanning {
  border: 2px solid var(--color-system); /* 蓝色圆环 */
  border-top-color: transparent; /* 顶部透明 → 弧线视觉 */
  animation: discover-spin 0.8s linear infinite; /* 无限旋转 */
}

/* 扫描完成：绿色实心圆 */
.discover-status-icon--done {
  background: var(--color-success); /* 绿色填充 */
}

/* 旋转关键帧 */
@keyframes discover-spin {
  to {
    transform: rotate(360deg); /* 完整一圈 */
  }
}

.discover-status-text {
  font-size: var(--text-sm); /* 12px */
  color: var(--text); /* 主文字色 */
}

.discover-status-round {
  font-size: var(--text-xs); /* 11px */
  color: var(--muted); /* 辅助文字色 */
}

/* ---- 手动配置面板 ---- */
.manual-config {
  display: flex; /* Flex 列布局 */
  flex-direction: column;
  gap: var(--spacing-md); /* 每个输入框间距 8px */
  padding: var(--spacing-md) 0; /* 上下 8px 间距 */
}

/* ---- 齿轮按钮 ---- */
.gear-btn {
  position: absolute; /* 相对于 .login-page 绝对定位 */
  right: var(--spacing-xl); /* 右下角：距右 16px */
  bottom: var(--spacing-xl); /* 右下角：距底 16px */
}

/* 齿轮激活态：accent 色高亮 */
.gear-btn--active {
  color: var(--accent) !important; /* 金色高亮，覆盖 Button subtle 默认色 */
}
</style>
