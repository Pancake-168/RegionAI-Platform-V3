// NocoBase 认证状态 store — 全局单例，管理 NocoBase API 的 token 和 baseURL
import { defineStore } from 'pinia' // Pinia 状态管理：defineStore 定义 store
import { ref, computed } from 'vue' // Vue 响应式：ref 创建响应式变量，computed 创建派生状态
import { createLogger } from '@/utils/logger' // 项目日志体系：按文件名+函数名创建 logger

// 创建带上下文的 logger 实例，所有日志自动带 [RegionAI:NocoBaseAuth.ts:useNocoBaseAuthStore] 前缀
const log = createLogger('NocoBaseAuth.ts', 'useNocoBaseAuthStore')

// 导出 useNocoBaseAuthStore，组件中通过 const auth = useNocoBaseAuthStore() 使用
export const useNocoBaseAuthStore = defineStore('nocoBaseAuth', () => {
  // =====================
  // 响应式状态
  // =====================

  // NocoBase API 的认证 token，null 表示未登录
  const token = ref<string | null>(null)
  // NocoBase API 的基础地址（如 https://db.zheshu.tech/api）
  const baseURL = ref<string | null>(null)

  // =====================
  // 派生状态
  // =====================

  // 是否有有效的登录态：token 不为 null 且不为空字符串
  const isLoggedIn = computed<boolean>(() => {
    // 取得当前 token 值，trim 后检查是否非空
    return (token.value?.trim() || '') !== ''
  })

  // =====================
  // 操作方法
  // =====================

  /**
   * 存储认证信息。
   * 登录页面调用此方法，将 token 和服务器地址写入 store。
   * @param t — NocoBase API token
   * @param url — NocoBase 服务器基础地址
   */
  function setAuth(t: string, url: string): void {
    // 去除首尾空白后存储 token
    token.value = t.trim()
    // 去除首尾空白后存储 baseURL
    baseURL.value = url.trim()
    // 记录日志：token 仅输出前 8 位以保护敏感信息
    log.info('认证信息已存储', {
      baseURL: url.trim(),
      tokenPrefix: t.trim().slice(0, 8) + '...',
    })
  }

  /**
   * 清除认证信息。
   * 退出登录时调用，清空 store 中的 token 和 baseURL。
   */
  function clearAuth(): void {
    // 记录清除前的状态用于日志
    log.info('认证信息已清除', { hadToken: !!token.value })
    // 清空 token
    token.value = null
    // 清空 baseURL
    baseURL.value = null
  }

  // 导出 store 的公开接口
  return { token, baseURL, isLoggedIn, setAuth, clearAuth }
})
