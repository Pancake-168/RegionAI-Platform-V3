// NocoBase URL 配置与解析工具
// 提供 URL 相对/绝对互转、登录认证函数
import { getNocobaseUrl } from '@/apiUrls'
import { APIClient } from '@nocobase/sdk' // NocoBase SDK APIClient
import { nocoBaseService } from '@/services/NocoBase/client' // 全局单例客户端管理器
import { createLogger } from '@/utils/logger' // 项目日志体系

// =====================
// URL 转换工具函数
// 注意：服务器地址选项已从用户手动选择改为自动扫描 + 登录页手动输入，
// 因此不再需要预定义的 NOCOBASE_SERVER_OPTIONS 常量
// =====================

// 创建工具函数的 logger 实例
const urlLog = createLogger('url.ts', 'getNocoBaseHosts')
const resolveLog = createLogger('url.ts', 'resolveNocoBaseFullUrl')

/**
 * 获取纯净的 NocoBase base（去掉末尾 /）。
 * 例如 https://db.zheshu.tech/
 * @returns 去掉末尾斜杠的 NocoBase 基础地址
 */
function getCleanNocoBase(): string {
  // 读取环境变量，trim 后去掉末尾所有斜杠
  return getNocobaseUrl().replace(/\/+$/, '')
}

/**
 * 判断 URL 是否为 NocoBase 相对路径。
 * 以 /admin 或 /apps/ 开头视为 NocoBase 内部路径。
 * @param url — 待判断的 URL
 * @returns true 表示是 NocoBase 相对路径
 */
export function isNocoBaseRelativePath(url: string): boolean {
  // 去除首尾空白后取前缀
  const trimmed = (url || '').trim()
  // 以 /admin 或 /apps/ 开头的视为 NocoBase 路径
  return trimmed.startsWith('/admin') || trimmed.startsWith('/apps/')
}

/**
 * 将完整 NocoBase URL 转为相对路径（去掉 base 前缀）。
 * 非 NocoBase URL 则原样返回。
 * @param fullUrl — 完整的 NocoBase URL（如 https://db.zheshu.tech/admin/xxx）
 * @returns 相对路径（如 /admin/xxx）
 */
export function toNocoBaseRelativeUrl(fullUrl: string): string {
  // 去除首尾空白
  const trimmed = fullUrl.trim()
  // 获取纯净的 base（无末尾 /）
  const cleanBase = getCleanNocoBase()
  // 如果 URL 以 base 开头，去掉 base 部分
  if (trimmed.startsWith(cleanBase)) {
    // 截取 base 之后的部分，至少返回 /
    return trimmed.slice(cleanBase.length) || '/'
  }
  // 如果 URL 包含 /nocobase-proxy（走代理访问的情况）
  if (trimmed.includes('/nocobase-proxy')) {
    // 找到 /nocobase-proxy 的起始位置
    const idx = trimmed.indexOf('/nocobase-proxy')
    // 截取 /nocobase-proxy 之后的部分，至少返回 /
    return trimmed.slice(idx + '/nocobase-proxy'.length) || '/'
  }
  // 非 NocoBase URL，原样返回
  return trimmed
}

/**
 * 将相对路径补全为 NocoBase 绝对 URL。
 * 已经是绝对 URL 则原样返回。
 * @param pathOrUrl — 相对路径或完整 URL
 * @returns 完整的绝对 URL
 */
export function resolveNocoBaseFullUrl(pathOrUrl: string): string {
  // 去除首尾空白
  const trimmed = (pathOrUrl || '').trim()
  // http/https 绝对 URL → 原样返回
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
    return trimmed
  // 其他协议 URL（mailto:、tel:、ftp:、matrix: 等）→ 原样返回，避免错误拼接 NocoBase 域名
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    resolveLog.info('非 HTTP 协议 URL，跳过补全', { url: trimmed })
    return trimmed
  }
  // 以 / 开头的相对路径 → 补全为 NocoBase 绝对 URL
  if (trimmed.startsWith('/')) return `${getCleanNocoBase()}${trimmed}`
  // 普通相对路径 → 补全 base + / + 路径
  return `${getCleanNocoBase()}/${trimmed}`
}

/**
 * 获取 NocoBase 的各 host 变体（用于 host 匹配检测）。
 * 包含 localhost 和实际域名，支持局域网开发场景。
 * @returns host 字符串数组
 */
export function getNocoBaseHosts(): string[] {
  // 从 base URL 中提取 host（去掉协议头）
  const host = getCleanNocoBase().replace('https://', '').replace('http://', '')
  // 返回实际 host（不再包含硬编码的内网 IP，地址由扫描或手动输入提供）
  const hosts = [host].filter(Boolean) // 仅保留非空 host
  // 追加 localhost 兜底（开发环境回环地址，无端口号）
  hosts.push('localhost')
  // 记录日志
  urlLog.info('NocoBase host 列表', { hosts })
  return hosts
}

// =====================
// 认证函数
// =====================

// 创建登录函数的 logger 实例
const loginLog = createLogger('url.ts', 'loginByAccount')

/**
 * 规范化 API 地址。
 * 去掉首尾空白和末尾斜杠，补全 /api 后缀（如果缺失）。
 * @param url — 原始 API 地址
 * @returns 规范化后的地址（如 https://db.zheshu.tech/api）
 */
function normalizeUrl(url: string): string {
  // 去除首尾空白
  const trimmed = url.trim()
  // 空字符串直接返回
  if (!trimmed) return ''
  // 相对路径（/ 开头）直接返回
  if (trimmed.startsWith('/')) {
    return trimmed
  }
  // http/https 开头 → 已完整，直接返回
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  // 纯域名 → 补全 https:// 协议头
  return `https://${trimmed}`
}

/**
 * 账号密码登录 NocoBase。
 * 使用 NocoBase SDK 的 auth.signIn 方法获取 token。
 * @param url — NocoBase API 地址
 * @param username — 账号
 * @param password — 密码
 * @returns 已认证的 APIClient，失败返回 null
 */
export async function loginByAccount(
  url: string,
  username: string,
  password: string,
): Promise<APIClient | null> {
  // 规范化 API 地址
  const finalUrl = normalizeUrl(url)
  // 参数校验：地址、账号、密码均不能为空
  if (!finalUrl || !username.trim() || !password.trim()) {
    // 记录警告
    loginLog.warn('登录参数不完整', {
      hasUrl: !!finalUrl,
      hasUsername: !!username.trim(),
    })
    return null
  }

  // 创建临时客户端（未认证）
  const tempClient = new APIClient({
    baseURL: finalUrl,
  })

  // 调用 SDK 的登录接口，传入账号密码（密码字段不输出日志）
  const response = await tempClient.auth.signIn({
    account: username.trim(), // 去除空白
    password: password.trim(), // 去除空白
  })

  // 从响应中提取 token：优先取 data.data.token，其次取 SDK 内部缓存的 token
  const token = response?.data?.data?.token || tempClient.auth.getToken()
  // token 为空则登录失败
  if (!token) {
    loginLog.warn('未获取到 token', { username: username.trim() })
    return null
  }

  // 用获取到的 token 创建正式的已认证客户端
  loginLog.info('登录成功', {
    username: username.trim(),
    tokenPrefix: String(token).slice(0, 8) + '...',
  })
  return nocoBaseService.createClient(String(token), finalUrl)
}

/**
 * Token 直接登录 NocoBase。
 * 跳过账号密码步骤，直接用已有 token 创建客户端。
 * @param url — NocoBase API 地址
 * @param token — 已有的认证 token
 * @returns 已认证的 APIClient
 */
export async function loginByToken(
  url: string,
  token: string,
): Promise<APIClient | null> {
  // 规范化 API 地址
  const finalUrl = normalizeUrl(url)
  // 参数校验
  if (!finalUrl || !token.trim()) {
    loginLog.warn('Token 登录参数不完整', { hasUrl: !!finalUrl })
    return null
  }

  // 直接用 token 创建客户端，跳过账号密码验证
  loginLog.info('Token 登录成功', {
    tokenPrefix: token.trim().slice(0, 8) + '...',
  })
  return nocoBaseService.createClient(token.trim(), finalUrl)
}
