// NocoBase 管理层数据获取 — embed page data access layer
// 提供管理员级别的全量分页拉取、collections 列表、collection 行数据查询
// 与 info.ts 的区别：info.ts 提供单页探测，embed.ts 提供全量分页循环拉取
import { APIClient } from '@nocobase/sdk' // NocoBase SDK APIClient
import { loginByToken } from '@/services/NocoBase/url' // Token 登录函数
import { nocoBaseService } from '@/services/NocoBase/client' // 全局单例客户端
import { getNocobaseUrl, getNocobaseProxyUrl } from '@/apiUrls' // URL 配置
import { useNocoBaseAuthStore } from '@/stores/NocoBaseAuth' // 认证状态 store
import { isTauri } from '@/utils/isTauri' // Tauri 运行时检测
import { getCollectionDataByApplication } from '@/services/NocoBase/data/info' // 子应用 collection 数据查询

// 导出页面标题解析函数供外部使用
export { resolveNocoBasePageTitle } from '@/services/NocoBase/data/info'

import { createLogger } from '@/utils/logger' // 项目日志体系

// =====================
// 常量
// =====================

// listNocoBaseCollection 的默认每页条数
const DEFAULT_PAGE_SIZE = 50
// 最大分页循环次数（防止死循环，200 页 × 50 条 = 最多 10000 条）
const MAX_PAGE_FETCHES = 200
// 嵌入页使用的 NocoBase API 基础路径（相对路径，走 Vite proxy）
const EMBED_NOCOBASE_API_BASE = '/nocobase-proxy/api'

// =====================
// Logger 实例
// =====================

const ensureAdminLog = createLogger('embed.ts', 'ensureNocoBaseAdminClient')
const listCollectionsLog = createLogger('embed.ts', 'listNocoBaseCollections')
const listCollectionLog = createLogger('embed.ts', 'listNocoBaseCollection')
const resolveAppIdLog = createLogger('embed.ts', 'resolveNocoBaseAppIdentifier')
const fetchAllAppCollLog = createLogger('embed.ts', 'fetchAllAppCollections')
const fetchAllRootCollLog = createLogger('embed.ts', 'fetchAllRootCollections')
const fetchAllRootRowsLog = createLogger(
  'embed.ts',
  'fetchAllRootCollectionRows',
)
const fetchAllAppRowsLog = createLogger('embed.ts', 'fetchAllAppCollectionRows')

// =====================
// 类型别名
// =====================

// 通用 NocoBase 记录
type NocoRecord = Record<string, unknown>
// Collection 记录
type NocoCollectionRecord = Record<string, unknown>

// =====================
// 内部状态
// =====================

// 管理员客户端 Promise：同一时刻只有一个登录尝试（去重）
let adminClientPromise: Promise<APIClient | null> | null = null

// =====================
// 内部工具函数
// =====================

/**
 * 规范化 API 基础地址：去掉末尾斜杠，确保以 /api 结尾。
 * @param url — 原始 URL
 * @returns 规范化后的 URL
 */
function normalizeApiBase(url: string): string {
  // 转字符串，trim，去掉末尾所有斜杠
  const trimmed = String(url || '')
    .trim()
    .replace(/\/+$/, '')
  // 空值返回空
  if (!trimmed) return ''
  // 已有 /api 后缀 → 原样返回
  if (trimmed.endsWith('/api')) return trimmed
  // 拼接 /api
  return `${trimmed}/api`
}

/**
 * 解析管理员客户端的 baseURL。
 * Electron/Tauri 打包后无 Vite proxy，需使用绝对地址；dev 模式用相对路径。
 * @returns 规范化后的 API baseURL
 */
function resolveAdminBaseURL(): string {
  // 检测是否为 Tauri 打包环境：
  // Tauri dev:   http://localhost:1420（有 Vite proxy，走相对路径）
  // Tauri prod:  https://tauri.localhost（无 Vite proxy，需绝对地址直连）
  // 浏览器 dev:  http://localhost:1420（有 Vite proxy）
  // isTauri() 在 Tauri 运行时返回 true，配合 hostname 判断是否为打包环境
  const isPackaged =
    isTauri() &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'

  // 打包环境 → 使用绝对地址直连
  if (isPackaged) {
    // 优先用代理地址（Nginx 反代）
    const proxyUrl = getNocobaseProxyUrl()
    if (
      proxyUrl &&
      (proxyUrl.startsWith('http://') || proxyUrl.startsWith('https://'))
    ) {
      return normalizeApiBase(proxyUrl)
    }
    // 其次用直连地址
    const envUrl = getNocobaseUrl()
    if (
      envUrl &&
      (envUrl.startsWith('http://') || envUrl.startsWith('https://'))
    ) {
      return normalizeApiBase(envUrl)
    }
  }

  // Dev / Web 模式 → 走 Vite proxy 相对路径
  return normalizeApiBase(EMBED_NOCOBASE_API_BASE)
}

/**
 * 从各种响应格式中提取数组。
 * NocoBase 响应可能是 payload 本身就是数组，也可能是 { data: [...] } 包裹。
 * @param payload — API 响应数据
 * @returns 提取的数组
 */
function getListData(payload: unknown): NocoRecord[] {
  // 本身就是数组 → 直接返回
  if (Array.isArray(payload)) return payload as NocoRecord[]
  // 对象且有 data 属性且 data 是数组 → 返回 data
  if (payload && typeof payload === 'object') {
    const record = payload as { data?: unknown }
    if (Array.isArray(record.data)) return record.data as NocoRecord[]
  }
  // 其他情况返回空数组
  return []
}

/**
 * 从 attempts 中自动选择 preferred 数据。
 * 优先级：appHeader > appParam > appPath → null
 * @param attempts — attempts 对象
 * @returns preferred 数据
 */
function getPreferredAttemptData(
  attempts: Record<string, unknown> | null | undefined,
): unknown {
  // 无 attempts → 返回 null
  if (!attempts || typeof attempts !== 'object') {
    return null
  }
  // 链式回退：appHeader.data → appParam.data → appPath.data → null
  const attemptRecord = attempts as Record<
    string,
    { data?: unknown } | undefined
  >
  return (
    attemptRecord.appHeader?.data ??
    attemptRecord.appParam?.data ??
    attemptRecord.appPath?.data ??
    null
  )
}

/**
 * 全量获取子应用指定 collection 的所有行（自动分页循环）。
 * @param appName — 子应用名称
 * @param collectionName — collection 名称
 * @param pageSize — 每页条数
 * @returns 全量行数据数组
 */
async function fetchAllAppCollectionRows(
  appName: string, // 子应用名
  collectionName: string, // collection 名
  pageSize: number, // 每页条数
): Promise<NocoRecord[]> {
  // 累积所有行
  const mergedRows: NocoRecord[] = []

  // 循环分页，最多 MAX_PAGE_FETCHES 次
  for (let page = 1; page <= MAX_PAGE_FETCHES; page += 1) {
    // 调用 info.ts 的 collection 查询函数
    const response = await getCollectionDataByApplication(
      appName,
      collectionName,
      {
        page, // 当前页码
        pageSize, // 每页条数
      },
    )
    // 提取 preferred 数据
    const preferredData = getPreferredAttemptData(
      response?.attempts as Record<string, unknown> | null | undefined,
    )
    // 提取数组
    const pageRows = getListData(preferredData)
    // 累加到结果数组
    mergedRows.push(...pageRows)
    // 记录分页进度
    fetchAllAppRowsLog.info('分页获取', {
      appName,
      collectionName,
      page,
      count: pageRows.length,
    })

    // 本页数据不满 pageSize → 已到最后一页，停止循环
    if (pageRows.length < pageSize) {
      break
    }
  }

  fetchAllAppRowsLog.info('全量获取完成', {
    appName,
    collectionName,
    total: mergedRows.length,
  })
  return mergedRows
}

/**
 * 全量获取子应用的所有 collections（自动分页循环）。
 * 先尝试 x-app header 模式，失败回退到 __appName param 模式。
 * @param rootClient — 已认证的根层级客户端
 * @param appName — 子应用名称
 * @param pageSize — 每页条数
 * @returns 全量 collections 数组
 */
async function fetchAllAppCollections(
  rootClient: APIClient, // 根层级客户端
  appName: string, // 子应用名
  pageSize: number, // 每页条数
): Promise<NocoCollectionRecord[]> {
  // 累积所有 collections
  const mergedCollections: NocoCollectionRecord[] = []

  // 循环分页
  for (let page = 1; page <= MAX_PAGE_FETCHES; page += 1) {
    let pageCollections: NocoCollectionRecord[]

    try {
      // 主模式：x-app header
      const headerResponse = await rootClient.request({
        url: 'collections:list', // SDK action URL
        params: { page, pageSize }, // 分页参数
        headers: { 'x-app': appName }, // 子应用标识 header
      })
      // 提取数据

      const hRes = headerResponse as any // 动态属性访问
      pageCollections = getListData(
        hRes?.data?.data ?? hRes?.data ?? headerResponse,
      ) as NocoCollectionRecord[]
    } catch {
      // header 模式失败 → 回退到 param 模式
      fetchAllAppCollLog.warn('x-app header 模式失败，回退到 __appName param', {
        page,
      })
      const paramResponse = await rootClient.request({
        url: 'collections:list',
        params: { page, pageSize, __appName: appName }, // 通过参数传递子应用标识
      })

      const pRes = paramResponse as any // 动态属性访问
      pageCollections = getListData(
        pRes?.data?.data ?? pRes?.data ?? paramResponse,
      ) as NocoCollectionRecord[]
    }

    // 累加
    mergedCollections.push(...pageCollections)
    fetchAllAppCollLog.info('分页获取', {
      appName,
      page,
      count: pageCollections.length,
    })

    // 最后一页则停止
    if (pageCollections.length < pageSize) {
      break
    }
  }

  fetchAllAppCollLog.info('全量获取完成', {
    appName,
    total: mergedCollections.length,
  })
  return mergedCollections
}

/**
 * 全量获取根层级所有 collections（自动分页循环）。
 * 使用 APIClient.resource('collections').list() SDK API。
 * 若 SDK action 不存在，回退到 requestCollectionsWithRootClient() 原始请求。
 * @param rootClient — 已认证的根层级客户端
 * @param pageSize — 每页条数
 * @returns 全量 collections 数组
 */
async function fetchAllRootCollections(
  rootClient: APIClient, // 根层级客户端
  pageSize: number, // 每页条数
): Promise<NocoCollectionRecord[]> {
  // 获取 resource('collections') 的 list 方法
  const action = (
    rootClient.resource('collections') as Record<
      string,
      (params?: unknown) => Promise<unknown>
    >
  ).list
  // SDK action 不存在 → 回退到原始请求方式
  if (!action) {
    fetchAllRootCollLog.warn(
      'SDK action 不存在，回退到 requestCollectionsWithRootClient',
    )
    return await requestCollectionsWithRootClient(
      rootClient,
      undefined,
      pageSize,
    )
  }

  // 累积所有 collections
  const mergedCollections: NocoCollectionRecord[] = []

  // 循环分页
  for (let page = 1; page <= MAX_PAGE_FETCHES; page += 1) {
    // 调用 SDK action
    const response = await action({ page, pageSize })
    // 提取数组
    const pageCollections = getListData(response) as NocoCollectionRecord[]
    // 累加
    mergedCollections.push(...pageCollections)

    // 最后一页则停止
    if (pageCollections.length < pageSize) {
      break
    }
  }

  fetchAllRootCollLog.info('全量获取完成', { total: mergedCollections.length })
  return mergedCollections
}

/**
 * 全量获取根层级指定 collection 的所有行（自动分页循环）。
 * @param client — 已认证客户端
 * @param collectionName — collection 名称
 * @param pageSize — 每页条数
 * @returns 全量行数据数组
 * @throws 如果 SDK action 不存在
 */
async function fetchAllRootCollectionRows(
  client: APIClient, // 客户端
  collectionName: string, // collection 名
  pageSize: number, // 每页条数
): Promise<NocoRecord[]> {
  // 获取 resource(collectionName) 的 list 方法
  const action = (
    client.resource(collectionName) as Record<
      string,
      (params?: unknown) => Promise<unknown>
    >
  ).list
  // SDK action 不存在 → 无法继续
  if (!action) {
    throw new Error(`${collectionName}:list 不存在`)
  }

  // 累积所有行
  const mergedRows: NocoRecord[] = []

  // 循环分页
  for (let page = 1; page <= MAX_PAGE_FETCHES; page += 1) {
    // 调用 SDK action
    const response = await action({ page, pageSize })
    // 提取数组
    const pageRows = getListData(response)
    // 累加
    mergedRows.push(...pageRows)
    // 记录进度
    fetchAllRootRowsLog.info('分页', {
      collectionName,
      page,
      count: pageRows.length,
    })

    // 最后一页则停止
    if (pageRows.length < pageSize) {
      break
    }
  }

  return mergedRows
}

/**
 * 从 URL-like 字符串中提取 pathname。
 * 处理绝对 URL（http/https）和纯路径两种情况。
 * @param urlLike — URL 或路径字符串
 * @returns pathname 部分
 */
function getPathnameFromUrlLike(urlLike: string): string {
  // 转字符串并 trim
  const raw = String(urlLike || '').trim()
  // 空值返回空
  if (!raw) return ''

  // http/https 绝对 URL → 用 URL 对象解析 pathname
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      return new URL(raw).pathname || ''
    } catch {
      // 解析失败返回原始字符串
      return raw
    }
  }

  // 纯路径 → 直接返回
  return raw
}

/**
 * 使用 rootClient 直接请求 collections:list。
 * 用于 SDK resource API 不可用时的回退方案。
 * @param rootClient — 根层级客户端
 * @param appName — 可选的子应用名
 * @param pageSize — 每页条数，默认 200
 * @returns collections 数组
 */
async function requestCollectionsWithRootClient(
  rootClient: APIClient, // 客户端
  appName?: string, // 可选的子应用名
  pageSize: number = 200, // 每页条数
): Promise<NocoCollectionRecord[]> {
  // 构建请求配置
  const requestConfig = appName
    ? {
        // 子应用模式：url + x-app header
        url: 'collections:list',
        params: { pageSize }, // 子应用下通常足够容纳所有 collections
        headers: { 'x-app': appName },
      }
    : {
        // 根模式：仅 url + params
        url: 'collections:list',
        params: { pageSize },
      }

  // 发送请求
  const response = await rootClient.request(requestConfig)
  // 提取数据
  return getListData(
    (response as any)?.data?.data ?? (response as any)?.data ?? response,
  ) as NocoCollectionRecord[]
}

/**
 * 从 URL 中提取 NocoBase 子应用标识。
 * 匹配 /apps/{appName}/ 模式。
 * @param urlLike — URL 或路径
 * @returns 子应用标识，未匹配返回 undefined
 */
export function resolveNocoBaseAppIdentifier(
  urlLike: string,
): string | undefined {
  // 提取 pathname
  const pathname = getPathnameFromUrlLike(urlLike)
  // 正则匹配 /apps/{appName}/ 或 /apps/{appName}$
  const match = pathname.match(/\/apps\/([^/]+)(?:\/|$)/)
  const identifier = match?.[1]?.trim() // 提取的 appName
  resolveAppIdLog.info(identifier ? '匹配到子应用标识' : '未匹配到子应用标识', {
    identifier,
  })
  return identifier || undefined
}

/**
 * 判断 URL 是否为主应用路径（以 /admin 开头）。
 * @param urlLike — URL 或路径
 * @returns true 表示是主应用路径
 */
export function isRootNocoBasePath(urlLike: string): boolean {
  // 提取 pathname
  const pathname = getPathnameFromUrlLike(urlLike)
  // 匹配 /admin 开头
  return /^\/admin(?:\/|$)/.test(pathname)
}

// =====================
// 管理员客户端管理
// =====================

/**
 * 创建管理员客户端。
 * 从 NocoBaseAuth store 获取已登录的 token，用 token 登录方式创建客户端。
 * 不再从环境变量硬编码凭据。
 * @returns 已认证的 APIClient，无 token 时返回 null
 */
async function createAdminClient(): Promise<APIClient | null> {
  // 从 Pinia store 获取认证信息
  const authStore = useNocoBaseAuthStore()
  // 未登录 → 无法创建
  if (!authStore.isLoggedIn) {
    ensureAdminLog.warn('未登录，跳过管理员客户端创建')
    return null
  }

  // 解析 baseURL
  const baseURL = resolveAdminBaseURL()
  // baseURL 不能为空
  if (!baseURL) {
    ensureAdminLog.warn('缺少 baseURL')
    return null
  }

  ensureAdminLog.info('开始管理员登录')
  // 用 store 中的 token 进行 token 登录
  const client = await loginByToken(baseURL, authStore.token!)
  if (client) {
    ensureAdminLog.info('管理员登录成功')
  } else {
    ensureAdminLog.warn('管理员登录失败')
  }
  return client
}

/**
 * 确保 NocoBase 管理员客户端可用。
 * 已登录则返回已有客户端；否则用 store 中的 token 登录。
 * 同一时刻只有一个登录 Promise（去重）。
 * @returns 已认证的管理员客户端，失败返回 null
 */
export async function ensureNocoBaseAdminClient(): Promise<APIClient | null> {
  // 先检查是否已有客户端（复用已有登录态）
  const existingClient = nocoBaseService.peekAuthedClient()
  if (existingClient) {
    ensureAdminLog.info('复用已有客户端')
    return existingClient
  }

  // 同一时刻只有一个登录 Promise（去重）
  if (!adminClientPromise) {
    // 创建登录 Promise，完成后清空
    adminClientPromise = createAdminClient().finally(() => {
      adminClientPromise = null // Promise 完成后重置为 null，允许后续再次尝试
    })
  }

  // 等待登录 Promise 完成
  return await adminClientPromise
}

/**
 * 重置管理员客户端。
 * 清空缓存的 Promise 和已认证客户端。退出登录时调用。
 */
export function resetNocoBaseAdminClient(): void {
  // 置空 Promise
  adminClientPromise = null
  // 清空客户端
  nocoBaseService.clearAuthedClient()
  ensureAdminLog.info('管理员客户端已重置')
}

/**
 * 构建 scoped API baseURL。
 * 有 appName 时拼接 /apps/{appName}/api 路径；无 appName 时返回根 baseURL。
 * @param rootBaseURL — 根 baseURL
 * @param appName — 可选的子应用名
 * @returns scoped baseURL
 */
function buildScopedApiBase(rootBaseURL: string, appName?: string): string {
  // 规范化根 baseURL：去末尾斜杠
  const normalizedRootBaseURL = String(rootBaseURL || '')
    .trim()
    .replace(/\/+$/, '')
  // 规范化 appName
  const normalizedAppName = String(appName || '').trim()
  // 无 appName → 返回根 baseURL
  if (!normalizedAppName) {
    return normalizedRootBaseURL
  }

  // 相对路径 → /nocobase-proxy/apps/{appName}/api
  if (normalizedRootBaseURL.startsWith('/')) {
    const proxyPrefix = normalizedRootBaseURL.replace(/\/api$/, '') // 去掉 /api 后缀
    return `${proxyPrefix}/apps/${encodeURIComponent(normalizedAppName)}/api` // 拼子应用路径
  }

  // 绝对 URL → https://xxx/apps/{appName}/api
  const origin = normalizedRootBaseURL.replace(/\/api$/, '') // 去掉 /api 后缀
  return `${origin}/apps/${encodeURIComponent(normalizedAppName)}/api`
}

/**
 * 创建 scoped client（带子应用上下文）。
 * 复用根客户端的 token，但用子应用路径作为 baseURL。
 * @param rootBaseURL — 根 baseURL
 * @param appName — 可选的子应用名
 * @returns scoped APIClient，token 缺失时返回 null
 */
function createScopedClient(
  rootBaseURL: string,
  appName?: string,
): APIClient | null {
  // 获取当前 token
  const token = nocoBaseService.peekAuthedToken()
  // token 或 baseURL 缺失 → 无法创建
  if (!token || !rootBaseURL) {
    return null
  }

  // 构建 scoped baseURL
  const baseURL = buildScopedApiBase(rootBaseURL, appName)
  // 创建新客户端
  const client = new APIClient({ baseURL })
  // 设置 token
  client.auth.setToken(token)
  return client
}

// =====================
// 公开 API
// =====================

/**
 * 列出 NocoBase collections。
 * 支持子应用过滤和自定义分页大小。自动分页循环获取全量数据。
 * @param options — { appName?, pageSize? } 可选配置
 * @returns 全量 collections 记录数组
 * @throws 如果管理员客户端初始化失败
 */
export async function listNocoBaseCollections(options?: {
  appName?: string // 子应用名称（可选）
  pageSize?: number // 每页条数（可选，默认 200）
}): Promise<NocoCollectionRecord[]> {
  // 确保管理员客户端可用
  const rootClient = await ensureNocoBaseAdminClient()
  if (!rootClient) {
    throw new Error('NocoBase 管理员客户端初始化失败')
  }

  // 分页大小：外部传入 > 默认 200
  const pageSize = options?.pageSize ?? 200
  // 子应用名：trim 后若为空则视为无
  const appName = String(options?.appName || '').trim() || undefined

  listCollectionsLog.info('列出 collections', { appName, pageSize })

  // 有子应用 → 走子应用全量拉取
  if (appName) {
    return await fetchAllAppCollections(rootClient, appName, pageSize)
  }

  // 无子应用 → 先尝试 scoped client，失败则回退 root client
  const rootBaseURL =
    nocoBaseService.peekAuthedBaseURL() || resolveAdminBaseURL()
  const scopedClient = createScopedClient(rootBaseURL)

  if (scopedClient) {
    try {
      // scoped client 成功 → 用它拉取
      return await fetchAllRootCollections(scopedClient, pageSize)
    } catch (error) {
      listCollectionsLog.warn('scoped client list 失败，回退 root fallback', {
        error: (error as Error)?.message,
      })
    }
  }

  // scoped client 不可用或失败 → 用 root client 拉取
  return await fetchAllRootCollections(rootClient, pageSize)
}

/**
 * 列出指定 NocoBase collection 的全量行数据。
 * 支持子应用过滤和自定义分页大小。自动分页循环获取全量数据。
 * @param collectionName — collection 名称（必传）
 * @param options — { appName?, pageSize? } 可选配置
 * @returns 全量行数据数组
 * @throws 如果管理员客户端初始化失败
 */
export async function listNocoBaseCollection(
  collectionName: string, // collection 名称
  options?: {
    appName?: string // 子应用名称（可选）
    pageSize?: number // 每页条数（可选，默认 50）
  },
): Promise<NocoRecord[]> {
  // collection 名称为空 → 返回空数组
  const normalizedCollectionName = String(collectionName || '').trim()
  if (!normalizedCollectionName) {
    return []
  }

  // 分页大小：外部传入 > DEFAULT_PAGE_SIZE (50)
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE

  // 确保管理员客户端可用
  const rootClient = await ensureNocoBaseAdminClient()
  if (!rootClient) {
    throw new Error('NocoBase 管理员客户端初始化失败')
  }

  // 子应用名
  const appName = String(options?.appName || '').trim()

  listCollectionLog.info('列出 collection', {
    collectionName: normalizedCollectionName,
    appName,
    pageSize,
  })

  // 有子应用 → 走子应用全量行拉取
  if (appName) {
    return await fetchAllAppCollectionRows(
      appName,
      normalizedCollectionName,
      pageSize,
    )
  }

  // 无子应用 → 用 scoped client 或 root client
  const rootBaseURL =
    nocoBaseService.peekAuthedBaseURL() || resolveAdminBaseURL()
  const client = createScopedClient(rootBaseURL) || rootClient
  return await fetchAllRootCollectionRows(
    client,
    normalizedCollectionName,
    pageSize,
  )
}
