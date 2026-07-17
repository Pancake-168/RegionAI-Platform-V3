// NocoBaseService — APIClient 单例管理器
// 负责创建、存储、提供 NocoBase SDK 的 APIClient 实例
// 全局唯一实例 nocoBaseService，所有 NocoBase API 调用共享同一个客户端
import { APIClient } from '@nocobase/sdk' // NocoBase SDK 的 APIClient：HTTP 客户端 + auth + resource
import { createLogger } from '@/utils/logger' // 项目日志体系

// 创建带上下文的 logger 实例
const log = createLogger('client.ts', 'NocoBaseService')

class NocoBaseService {
  // 基础客户端实例（未认证状态），仅保存 baseURL 配置
  private NoAuthenticatedClient: APIClient | null = null

  // 已认证客户端实例（含 token），业务调用主要使用此实例
  private AuthenticatedClient: APIClient | null = null

  // 已认证客户端的 baseURL 缓存，用于 URL 拼接和 scoped client 创建
  private AuthedBaseURL: string | null = null

  /**
   * 创建客户端。
   * 接收 token 和服务器地址，构造 APIClient 并设置认证 token。
   * @param token — NocoBase API 的认证 token
   * @param serverUrl — NocoBase 服务器地址（支持相对路径、绝对路径、无协议域名）
   * @returns 已认证的 APIClient 实例
   */
  createClient(token: string, serverUrl: string): APIClient {
    // 去除首尾空白
    let finalServerUrl = serverUrl.trim()

    // 如果是相对路径（如 /nocobase-proxy/api），保持原样，由 Vite proxy 转发
    if (finalServerUrl.startsWith('/')) {
      // 相对路径不做协议补全
    }
    // 如果既不是 http:// 也不是 https:// 开头，补全 https:// 协议
    else if (
      !finalServerUrl.startsWith('http://') &&
      !finalServerUrl.startsWith('https://')
    ) {
      // 纯域名 → 补全协议头
      finalServerUrl = `https://${finalServerUrl}`
    }

    // 用处理后的地址创建未认证客户端
    this.NoAuthenticatedClient = new APIClient({
      baseURL: finalServerUrl, // API 基础地址
    })

    // 将未认证客户端赋值给已认证客户端引用
    this.AuthenticatedClient = this.NoAuthenticatedClient
    // 设置认证 token
    this.AuthenticatedClient.auth.setToken(token)
    // 缓存 baseURL 供后续使用
    this.AuthedBaseURL = finalServerUrl

    // 记录日志：token 仅输出前缀
    log.info('客户端已创建', {
      baseURL: finalServerUrl,
      tokenPrefix: token.slice(0, 8) + '...',
    })

    // 返回已认证客户端供调用方使用
    return this.AuthenticatedClient
  }

  /**
   * 获取基础客户端（未认证）。
   * @returns 未认证的 APIClient，未初始化时返回 null 并打印警告
   */
  getNoAuthedClient(): APIClient | null {
    // 检查基础客户端是否已初始化
    if (!this.NoAuthenticatedClient) {
      // 未初始化时记录警告
      log.warn('尚未初始化基础客户端')
      return null
    }
    // 返回基础客户端
    return this.NoAuthenticatedClient
  }

  /**
   * 从外部设置已认证客户端。
   * 用于登录页面独立创建客户端后注入到服务层。
   * @param client — 已认证的 APIClient 实例
   */
  setAuthedClient(client: APIClient): void {
    // 存储客户端引用
    this.AuthenticatedClient = client
    // 尝试从客户端实例中提取 baseURL（APIClient 内部用 axios 实例存储 baseURL）

    const clientAny = client as any // 动态属性访问，绕过类型检查
    const maybeBaseURL: unknown =
      clientAny?.axios?.defaults?.baseURL || clientAny?.baseURL // 优先 axios.defaults.baseURL
    // 如果是字符串则更新缓存
    this.AuthedBaseURL =
      typeof maybeBaseURL === 'string' ? maybeBaseURL : this.AuthedBaseURL
    log.info('外部设置已认证客户端')
  }

  /**
   * 获取已认证客户端。
   * @returns 已认证的 APIClient，未初始化时返回 null 并打印警告
   */
  getAuthedClient(): APIClient | null {
    // 检查已认证客户端是否已初始化
    if (!this.AuthenticatedClient) {
      // 未初始化时记录警告
      log.warn('尚未初始化已认证客户端')
      return null
    }
    // 返回已认证客户端
    return this.AuthenticatedClient
  }

  /**
   * 清理所有客户端状态。
   * 退出登录时调用，清空所有缓存的客户端和 baseURL。
   */
  clearAuthedClient(): void {
    // 置空已认证客户端
    this.AuthenticatedClient = null
    // 置空基础客户端
    this.NoAuthenticatedClient = null
    // 置空 baseURL 缓存
    this.AuthedBaseURL = null
    log.info('客户端已清理')
  }

  /**
   * 获取已认证客户端的 token。
   * @returns token 字符串，未找到时返回 null 并打印警告
   */
  getAuthedToken(): string | null {
    // 检查已认证客户端是否存在
    if (!this.AuthenticatedClient) {
      log.warn('尚未初始化已认证客户端')
      return null
    }

    // APIClient 的 auth 对象可能有 getToken() 方法或 token 属性（兼容不同版本）
    const token =
      this.AuthenticatedClient.auth.getToken?.() ||
      this.AuthenticatedClient.auth.token
    // 检查 token 是否存在
    if (!token) {
      log.warn('当前已认证客户端中未找到 token')
      return null
    }

    // 转为字符串返回
    return String(token)
  }

  /**
   * 静默获取已认证客户端（不打日志）。
   * 用于高频调用场景，避免日志刷屏。
   * @returns 已认证的 APIClient 或 null
   */
  peekAuthedClient(): APIClient | null {
    // 直接返回，不判断是否为空，不打印日志
    return this.AuthenticatedClient
  }

  /**
   * 静默获取 token（不打日志）。
   * @returns token 字符串或 null
   */
  peekAuthedToken(): string | null {
    // 检查客户端是否存在
    if (!this.AuthenticatedClient) {
      return null
    }

    // 获取 token
    const token =
      this.AuthenticatedClient.auth.getToken?.() ||
      this.AuthenticatedClient.auth.token
    // 有值则转字符串返回，否则返回 null
    return token ? String(token) : null
  }

  /**
   * 静默获取 baseURL（不打日志）。
   * 优先使用缓存的 AuthedBaseURL，其次从客户端实例中提取。
   * @returns baseURL 字符串或 null
   */
  peekAuthedBaseURL(): string | null {
    // 缓存中有值则直接返回
    if (this.AuthedBaseURL) {
      return this.AuthedBaseURL
    }

    // 缓存无值，尝试从客户端实例中提取

    const clientAny = this.AuthenticatedClient as any // 动态属性访问
    const fallback: unknown =
      clientAny?.axios?.defaults?.baseURL || clientAny?.baseURL // 优先 axios.defaults.baseURL
    // 如果是非空字符串则返回，否则返回 null
    return typeof fallback === 'string' && fallback.trim()
      ? fallback.trim()
      : null
  }

  /**
   * 获取已认证客户端的 baseURL。
   * @returns baseURL 字符串，未找到时返回 null 并打印警告
   */
  getAuthedBaseURL(): string | null {
    // 缓存中没有值时，尝试从客户端实例中提取
    if (!this.AuthedBaseURL) {
      const clientAny = this.AuthenticatedClient as any // 动态属性访问
      const fallback: unknown =
        clientAny?.axios?.defaults?.baseURL || clientAny?.baseURL // 优先 axios.defaults.baseURL
      // 提取到有效字符串则更新缓存
      if (typeof fallback === 'string' && fallback.trim()) {
        this.AuthedBaseURL = fallback.trim()
      }
    }

    // 缓存仍为空则打印警告
    if (!this.AuthedBaseURL) {
      log.warn('当前未记录已认证 baseURL')
      return null
    }

    // 返回缓存的 baseURL
    return this.AuthedBaseURL
  }
}

// 导出全局单例实例
export default NocoBaseService
// 创建并导出唯一实例，整个应用共享此实例
export const nocoBaseService = new NocoBaseService()
