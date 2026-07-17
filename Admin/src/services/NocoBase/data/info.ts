// NocoBase 数据获取引擎 — 核心数据获取层
// 所有数据获取均为全量分页循环拉取，不遗漏任何行
//   - 根层级：用户信息、子应用列表、collections、roles、users、路由、schema、工作流
//   - 子应用层级：指定 app 下的 collections、users 等（支持 x-app header / __appName param 双模式）
//   - Collection 数据：指定 collection 的全量数据
//   - UI Schema：指定 schema 的 JSON 树形结构
//   - 页面标题：从 NocoBase URL 自动解析页面标题
import { nocoBaseService } from '@/services/NocoBase/client' // 全局单例客户端管理器
import { APIClient } from '@nocobase/sdk' // NocoBase SDK APIClient
import { getNocobaseUrl, getNocobaseProxyUrl } from '@/apiUrls' // URL 配置读取
import { loginByAccount } from '@/services/NocoBase/url' // 账号密码登录函数
import { isTauri } from '@/utils/isTauri' // Tauri 运行时检测

// =====================
// 常量
// =====================

// 最大分页循环次数（防止死循环：200 页 × 500 条 = 最多 100000 条）
const MAX_PAGE_FETCHES = 200
import { createLogger } from '@/utils/logger' // 项目日志体系

// =====================
// 类型定义
// =====================

// 探测请求项类型
type ProbeItem = { key: string; url: string; params?: Record<string, unknown> }

// =====================
// 常量：默认探测端点列表
// =====================

// 根层级批量探测的 8 个端点：登录后一次性获取所有可见数据
// 串行执行，每个端点独立处理成功/失败
const DEFAULT_PROBES: ProbeItem[] = [
  { key: 'me', url: 'users:me' }, // 当前登录用户信息
  {
    key: 'applications',
    url: 'applications:list',
    params: { page: 1, pageSize: 200 },
  }, // 子应用列表（最多200个）
  {
    key: 'collections',
    url: 'collections:list',
    params: { page: 1, pageSize: 500 },
  }, // 数据表列表（最多500个）
  { key: 'roles', url: 'roles:list', params: { page: 1, pageSize: 200 } }, // 角色列表
  { key: 'users', url: 'users:list', params: { page: 1, pageSize: 200 } }, // 用户列表
  { key: 'uiRoutes', url: 'uiRoutes:getAccessible' }, // 可访问的 UI 路由
  {
    key: 'uiSchemas',
    url: 'uiSchemas:list',
    params: { page: 1, pageSize: 200 },
  }, // UI Schema 列表
  {
    key: 'workflows',
    url: 'workflows:list',
    params: { page: 1, pageSize: 200 },
  }, // 工作流列表
]

// =====================
// Logger 实例：按函数粒度创建
// =====================

const runProbesLog = createLogger('info.ts', 'runProbes')
const attachUISchemaTreeLog = createLogger('info.ts', 'attachUISchemaTree')
const getAllInfoLog = createLogger('info.ts', 'getAllAvailableNocoBaseInfo')
const getAppInfoLog = createLogger(
  'info.ts',
  'getAllAvailableNocoBaseInfoByApplication',
)
const getCollectionLog = createLogger(
  'info.ts',
  'getCollectionDataByApplication',
)
const getSchemaLog = createLogger('info.ts', 'getUISchemaJsonByApplication')
const resolveTitleLog = createLogger('info.ts', 'resolveNocoBasePageTitle')

// =====================
// 内部工具函数
// =====================

/**
 * 从探测结果中提取第一个 UI Schema 的 uid。
 * 用于后续获取完整的 JSON Schema 树。
 * @param data — 探测结果 data 对象（含 uiSchemas 数组）
 * @returns 第一个 schema 的 uid / x-uid / id / name，若无则返回 undefined
 */
const resolveFirstSchemaUid = (
  data: Record<string, unknown> | null | undefined,
): string | undefined => {
  // 从 data 中取 uiSchemas 数组，安全回退到空数组
  const schemas = Array.isArray(data?.uiSchemas)
    ? (data.uiSchemas as Array<Record<string, unknown>>)
    : []
  // 查找第一个有 uid / x-uid / id / name 属性的 schema
  const first = schemas.find(
    (item: Record<string, unknown>) =>
      item?.uid || item?.['x-uid'] || item?.id || item?.name,
  )
  // 按优先级返回 uid → x-uid → id → name
  return (first?.uid || first?.['x-uid'] || first?.id || first?.name) as
    string | undefined
}

/**
 * 为探测结果附加完整的 UI Schema 树。
 * 从探测结果中取第一个 schema uid，请求其 JSON Schema 并挂载到 data.uiSchemasTree。
 * @param client — 已认证的 APIClient
 * @param dataContainer — 探测结果 data 对象（将被原地修改）
 * @param params — 额外的请求参数
 * @param requestConfig — 额外的请求配置
 */
const attachUISchemaTree = async (
  client: APIClient, // NocoBase 客户端
  dataContainer: Record<string, unknown>, // 数据容器（会被原地添加 uiSchemasTree 属性）
  params?: Record<string, unknown>, // 额外的查询参数
  requestConfig?: Record<string, unknown>, // 额外的请求配置（如 headers）
): Promise<void> => {
  // 从数据容器中提取第一个 schema uid
  const schemaUid = resolveFirstSchemaUid(dataContainer)
  // 没有 uid 则无法获取树，直接返回
  if (!schemaUid) {
    attachUISchemaTreeLog.warn('未找到 schemaUid，无法获取 Schema 树')
    return
  }

  try {
    // 请求 UI Schema 的完整 JSON 树：includeAsyncNode 表示包含异步加载的节点
    const response = await client.request({
      url: `uiSchemas:getJsonSchema/${encodeURIComponent(schemaUid)}`, // 对 uid 做 URL 编码
      params: {
        includeAsyncNode: true, // 包含异步节点
        ...(params || {}), // 合并外部参数
      },
      ...(requestConfig || {}), // 合并外部配置
    })
    // 挂载到数据容器：优先取 data.data，其次 data，最后原始响应
    dataContainer.uiSchemasTree =
      response?.data?.data ?? response?.data ?? response
    attachUISchemaTreeLog.info('Schema 树已附加', { schemaUid })
  } catch (error: unknown) {
    // 请求失败时，设置 uiSchemasTree 为 null（表示尝试过但失败了）
    if (!dataContainer.uiSchemasTree) {
      dataContainer.uiSchemasTree = null
    }
    // 记录错误详情
    const err = error as { message?: string; response?: { status?: number } }
    dataContainer.uiSchemasTreeError = {
      message: err?.message || String(error), // 错误消息
      status: err?.response?.status, // HTTP 状态码
      url: `uiSchemas:getJsonSchema/${schemaUid}`, // 请求的 URL
    }
    attachUISchemaTreeLog.warn('获取 Schema 树失败', {
      schemaUid,
      error: err?.message,
    })
  }
}

/**
 * 执行批量探测。
 * 串行遍历 probes 列表，逐个发请求，每个端点的结果存入 result.data[key]，失败存入 result.errors[key]。
 * @param client — 已认证的 APIClient
 * @param probes — 探测端点列表
 * @param extraRequestConfig — 额外的请求配置（如子应用的 x-app header）
 * @returns { data, errors } 结构
 */
async function runProbes(
  client: APIClient, // NocoBase 客户端
  probes: ProbeItem[], // 探测端点列表
  extraRequestConfig?: Record<string, unknown>, // 额外请求配置
): Promise<{ data: Record<string, unknown>; errors: Record<string, unknown> }> {
  // 初始化返回结果容器
  const result: {
    data: Record<string, unknown>
    errors: Record<string, unknown>
  } = {
    data: {}, // 成功的数据
    errors: {}, // 失败的错误信息
  }

  // 记录探测开始
  runProbesLog.info('开始探测', { count: probes.length })
  // 分别计数成功和失败的端点
  let okCount = 0
  let failCount = 0

  // 串行遍历探测端点列表（for...of + await 保证顺序执行）
  for (const probe of probes) {
    try {
      // 判断是否分页端点：params 中含 page 和 pageSize 的为分页端点
      const pageSize = (probe.params?.pageSize as number) || 0
      const isPaginated = pageSize > 0 && probe.params?.page !== undefined

      if (isPaginated) {
        // =====================
        // 分页端点：循环拉取全量数据
        // =====================
        const allRows: unknown[] = [] // 累积所有页的数据行
        for (let page = 1; page <= MAX_PAGE_FETCHES; page += 1) {
          const response = await client.request({
            url: probe.url, // 如 'users:list'
            params: { ...(probe.params || {}), page }, // 更新页码
            ...(extraRequestConfig || {}), // 合并额外配置
          })
          // 提取本页数据：优先 response.data.data → response.data → response
          const pageData: unknown =
            response?.data?.data ?? response?.data ?? response
          // 提取数组行
          const pageRows: unknown[] = Array.isArray(pageData)
            ? pageData
            : (pageData as Record<string, unknown>)?.data
              ? ((pageData as Record<string, unknown>).data as unknown[])
              : []
          // 累加到全量数组
          allRows.push(...pageRows)
          runProbesLog.info('分页获取', {
            key: probe.key,
            page,
            count: pageRows.length,
          })
          // 本页不满 → 最后一页，停止
          if (pageRows.length < pageSize) break
        }
        // 全量数组存入结果
        result.data[probe.key] = allRows
        runProbesLog.info('全量获取完成', {
          key: probe.key,
          total: allRows.length,
        })
      } else {
        // =====================
        // 非分页端点：单次请求
        // =====================
        const response = await client.request({
          url: probe.url, // 如 'users:me'
          params: probe.params, // 无分页参数
          ...(extraRequestConfig || {}), // 合并额外配置
        })
        // 提取数据：优先取 response.data.data，其次 response.data，最后原始 response
        result.data[probe.key] =
          response?.data?.data ?? response?.data ?? response
        runProbesLog.info('探测成功', { key: probe.key })
      }
      okCount++
    } catch (error: unknown) {
      // 请求失败时记录错误信息
      const err = error as { message?: string; response?: { status?: number } }
      result.errors[probe.key] = {
        message: err?.message || String(error), // 错误消息
        status: err?.response?.status, // HTTP 状态码
        url: probe.url, // 请求 URL
      }
      failCount++
      runProbesLog.warn('探测失败', { key: probe.key, error: err?.message })
    }
  }

  // 记录探测完成
  runProbesLog.info('探测完成', { okCount, failCount })
  return result
}

// =====================
// 内部工具：URL 解析
// =====================

/**
 * 从 baseURL 中提取 origin（协议 + 域名）。
 * 用于构造子应用的 API 地址。
 * @param baseURL — API 基础地址
 * @returns origin 字符串（如 https://db.zheshu.tech）
 */
function getOriginFromBaseURL(baseURL: string): string {
  // 去除末尾所有斜杠
  const normalized = baseURL.trim().replace(/\/+$/, '')
  // 判断是否为 http/https 绝对地址
  const parsed =
    normalized.startsWith('http://') || normalized.startsWith('https://')
      ? new URL(normalized) // 绝对 URL → 用 URL 对象解析 origin
      : new URL(normalized, window.location.origin) // 相对路径 → 以当前页面 origin 为基准
  // 返回协议 + 域名部分
  return parsed.origin
}

/**
 * 确保 baseURL 以 /api 结尾。
 * 若已含 /api 则原样返回，否则拼接 /api。
 * @param baseURL — 原始 baseURL
 * @returns 以 /api 结尾的 baseURL
 */
function ensureApiBase(baseURL: string): string {
  // 去除末尾斜杠
  const normalized = baseURL.trim().replace(/\/+$/, '')
  // 已以 /api 结尾 → 原样返回
  if (normalized.endsWith('/api')) return normalized
  // 拼上 /api
  return `${normalized}/api`
}

// =====================
// 公开 API
// =====================

/**
 * 获取当前已登录账户能拿到的所有 NocoBase 信息（根层级）。
 * "有什么拿什么" —— 用一个 token 能看到的全部数据。
 * @returns 探测结果 { data, errors }，未登录返回 null
 */
export async function getAllAvailableNocoBaseInfo(): Promise<{
  data: Record<string, unknown>
  errors: Record<string, unknown>
} | null> {
  // 获取当前已认证客户端
  const client = nocoBaseService.getAuthedClient()
  // 未登录则返回 null
  if (!client) {
    getAllInfoLog.warn('未找到已认证客户端，请先登录')
    return null
  }

  // 执行批量探测
  getAllInfoLog.info('开始根层级探测')
  const result = await runProbes(client, DEFAULT_PROBES)
  getAllInfoLog.info('根层级探测完成', {
    okCount: Object.keys(result.data).length,
    failCount: Object.keys(result.errors).length,
  })
  return result
}

/**
 * 获取指定子应用的全部信息（能拿多少拿多少）。
 * 用两种模式同时尝试：appHeader（x-app header）和 appParam（__appName 参数）。
 * 两种模式各自发一套完整的 DEFAULT_PROBES，自动选择数据更多的模式作为 preferredMode。
 * @param appName — 子应用名称（如 'A_SYSTEM_SSO'）
 * @returns 含两种模式结果的探测数据，appName 为空返回 null
 */
export async function getAllAvailableNocoBaseInfoByApplication(
  appName: string,
): Promise<Record<string, unknown> | null> {
  // 参数校验
  const targetApp = appName?.trim()
  if (!targetApp) {
    getAppInfoLog.warn('appName 不能为空')
    return null
  }

  // 获取 token 和 baseURL
  const token = nocoBaseService.getAuthedToken()
  const authedBaseURL = nocoBaseService.getAuthedBaseURL()
  // token 或 baseURL 缺失则无法继续
  if (!token || !authedBaseURL) {
    getAppInfoLog.warn('未找到登录态，请先登录')
    return null
  }

  // 去除 baseURL 末尾斜杠
  const normalizedBase = authedBaseURL.trim().replace(/\/+$/, '')
  // 计算根 API 地址和子应用路径 API 地址
  let rootApiBase: string // 根 /api 地址，用于 x-app header 和 __appName param 模式
  let appPathApiBase: string // 子应用路径地址（/apps/{appName}/api），当前不使用

  if (normalizedBase.startsWith('/')) {
    // 相对路径：如 /nocobase-proxy/api
    rootApiBase = ensureApiBase(normalizedBase) // 确保以 /api 结尾
    // 去 /api 后拼接子应用路径
    const proxyPrefix = rootApiBase.replace(/\/api$/, '')
    appPathApiBase = `${proxyPrefix}/apps/${encodeURIComponent(targetApp)}/api`
  } else if (
    normalizedBase.endsWith('/api') ||
    normalizedBase.includes('/api/')
  ) {
    // 绝对 URL 已包含 /api 路径
    rootApiBase = normalizedBase.endsWith('/api')
      ? normalizedBase
      : normalizedBase.replace(/\/api\/.*$/, '/api')
    const proxyPrefix = rootApiBase.replace(/\/api$/, '')
    appPathApiBase = `${proxyPrefix}/apps/${encodeURIComponent(targetApp)}/api`
  } else {
    // 纯域名 → 从 origin 拼接
    const origin = getOriginFromBaseURL(normalizedBase)
    rootApiBase = ensureApiBase(origin)
    appPathApiBase = `${origin}/apps/${encodeURIComponent(targetApp)}/api`
  }

  // 创建 appHeader 模式客户端：用根 API baseURL + token
  const byAppHeaderClient = new APIClient({ baseURL: rootApiBase })
  byAppHeaderClient.auth.setToken(token)

  getAppInfoLog.info('探测子应用', { appName: targetApp, rootApiBase })

  // appPath 模式当前不启用（已标记 skipped）
  const byAppPath = {
    data: null,
    errors: { skipped: { message: 'appPath skipped' } },
  }

  // appHeader 模式：通过 x-app header 切换子应用上下文
  const byAppHeader = await runProbes(byAppHeaderClient, DEFAULT_PROBES, {
    headers: {
      'x-app': targetApp, // NocoBase 通过此 header 识别子应用上下文
    },
  })

  // appParam 模式：通过 __appName 参数切换子应用上下文
  const byAppParam = await runProbes(
    byAppHeaderClient,
    DEFAULT_PROBES.map((probe) => ({
      ...probe, // 展开原探测项
      params: {
        ...(probe.params || {}), // 保留原参数
        __appName: targetApp, // 子应用标识参数
      },
    })),
  )

  // 两种模式各自尝试附加 UI Schema 树
  if (byAppHeader?.data) {
    await attachUISchemaTree(
      byAppHeaderClient,
      byAppHeader.data as Record<string, unknown>,
      undefined,
      {
        headers: { 'x-app': targetApp },
      },
    )
  }
  if (byAppParam?.data) {
    await attachUISchemaTree(
      byAppHeaderClient,
      byAppParam.data as Record<string, unknown>,
      {
        __appName: targetApp,
      },
    )
  }

  // 统计两种模式各自的成功数
  const headerOkCount = Object.keys(byAppHeader.data || {}).length
  const paramOkCount = Object.keys(byAppParam.data || {}).length
  // 自动选择数据更多的模式
  const preferredMode = headerOkCount >= paramOkCount ? 'appHeader' : 'appParam'

  getAppInfoLog.info('探测完成', {
    appName: targetApp,
    preferredMode,
    headerOkCount,
    paramOkCount,
  })

  // 返回完整的探测结果
  return {
    appName: targetApp,
    meta: {
      preferredMode, // 推荐使用的模式
      rootApiBase, // 根 API 地址
      appPathApiBase, // 子应用路径 API 地址
    },
    attempts: {
      appPath: byAppPath, // appPath 模式结果（当前不使用）
      appHeader: byAppHeader, // appHeader 模式结果
      appParam: byAppParam, // appParam 模式结果
    },
  }
}

/**
 * 获取指定子应用下指定 collection 的数据（list）。
 * 同时尝试 appHeader 和 appParam 两种模式，两种结果都返回。
 * @param appName — 子应用名称
 * @param collectionName — collection 名称
 * @param params — 额外查询参数（page, pageSize 等）
 * @returns 含两种模式结果的查询数据
 */
export async function getCollectionDataByApplication(
  appName: string, // 子应用名称
  collectionName: string, // collection 名称
  params?: Record<string, unknown>, // 额外的查询参数
): Promise<Record<string, unknown> | null> {
  // 参数校验
  const targetApp = appName?.trim()
  const targetCollection = collectionName?.trim()
  if (!targetApp || !targetCollection) {
    getCollectionLog.warn('appName/collectionName 不能为空')
    return null
  }

  // 获取登录态
  const token = nocoBaseService.getAuthedToken()
  const authedBaseURL = nocoBaseService.getAuthedBaseURL()
  if (!token || !authedBaseURL) {
    getCollectionLog.warn('未找到登录态，请先登录')
    return null
  }

  // 解析 rootApiBase（逻辑同 getAllAvailableNocoBaseInfoByApplication）
  const normalizedBase = authedBaseURL.trim().replace(/\/+$/, '')
  let rootApiBase: string
  let appPathApiBase: string

  if (normalizedBase.startsWith('/')) {
    rootApiBase = ensureApiBase(normalizedBase)
    const proxyPrefix = rootApiBase.replace(/\/api$/, '')
    appPathApiBase = `${proxyPrefix}/apps/${encodeURIComponent(targetApp)}/api`
  } else if (
    normalizedBase.endsWith('/api') ||
    normalizedBase.includes('/api/')
  ) {
    rootApiBase = normalizedBase.endsWith('/api')
      ? normalizedBase
      : normalizedBase.replace(/\/api\/.*$/, '/api')
    const proxyPrefix = rootApiBase.replace(/\/api$/, '')
    appPathApiBase = `${proxyPrefix}/apps/${encodeURIComponent(targetApp)}/api`
  } else {
    const origin = getOriginFromBaseURL(normalizedBase)
    rootApiBase = ensureApiBase(origin)
    appPathApiBase = `${origin}/apps/${encodeURIComponent(targetApp)}/api`
  }

  // 构建 SDK action URL：collectionName:list
  const actionUrl = `${targetCollection}:list`

  // 分页参数：外部传入 > 默认 pageSize 50
  const pageSize = (params?.pageSize as number) || 50

  getCollectionLog.info('全量查询 collection', {
    appName: targetApp,
    collectionName: targetCollection,
    pageSize,
  })

  // 创建客户端
  const byAppHeaderClient = new APIClient({ baseURL: rootApiBase })
  byAppHeaderClient.auth.setToken(token)

  // 初始化 attempts 容器
  const attempts: Record<string, unknown> = {
    appPath: { data: null, error: { message: 'appPath skipped' } },
    appHeader: { data: null, error: null },
    appParam: { data: null, error: null },
  }

  // =====================
  // 辅助函数：全量分页循环拉取
  // =====================
  async function fetchAllPages(
    requestConfigFn: (page: number) => Record<string, unknown>,
  ): Promise<{
    data: unknown[] | null
    error: Record<string, unknown> | null
  }> {
    const allRows: unknown[] = [] // 累积所有页
    try {
      for (let page = 1; page <= MAX_PAGE_FETCHES; page += 1) {
        const config = requestConfigFn(page) // 生成当前页的请求配置
        const response = await byAppHeaderClient.request(
          config as Parameters<APIClient['request']>[0],
        )
        // 提取本页数据
        const pageData: unknown =
          response?.data?.data ?? response?.data ?? response
        const pageRows: unknown[] = Array.isArray(pageData)
          ? pageData
          : (pageData as Record<string, unknown>)?.data
            ? ((pageData as Record<string, unknown>).data as unknown[])
            : []
        // 累加
        allRows.push(...pageRows)
        getCollectionLog.info('分页获取', {
          appName: targetApp,
          collectionName: targetCollection,
          page,
          count: pageRows.length,
        })
        // 本页不满 → 最后一页
        if (pageRows.length < pageSize) break
      }
      return { data: allRows, error: null }
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { status?: number } }
      return {
        data: null,
        error: {
          message: err?.message || String(error),
          status: err?.response?.status,
          url: actionUrl,
        },
      }
    }
  }

  // =====================
  // appHeader 模式：全量分页
  // =====================
  const headerResult = await fetchAllPages((page: number) => ({
    url: actionUrl,
    params: { ...(params || {}), page, pageSize },
    headers: { 'x-app': targetApp },
  }))
  attempts.appHeader = headerResult

  // =====================
  // appParam 模式：全量分页
  // =====================
  const paramResult = await fetchAllPages((page: number) => ({
    url: actionUrl,
    params: { ...(params || {}), page, pageSize, __appName: targetApp },
  }))
  attempts.appParam = paramResult

  // 自动选择 preferred 模式：优先 appHeader，其次 appParam，都无则 'none'
  const preferredMode = (attempts.appHeader as Record<string, unknown>)?.data
    ? 'appHeader'
    : (attempts.appParam as Record<string, unknown>)?.data
      ? 'appParam'
      : 'none'

  getCollectionLog.info('全量查询完成', {
    appName: targetApp,
    collectionName: targetCollection,
    preferredMode,
    headerCount: Array.isArray(
      (attempts.appHeader as Record<string, unknown>)?.data,
    )
      ? ((attempts.appHeader as Record<string, unknown>).data as unknown[])
          .length
      : 0,
    paramCount: Array.isArray(
      (attempts.appParam as Record<string, unknown>)?.data,
    )
      ? ((attempts.appParam as Record<string, unknown>).data as unknown[])
          .length
      : 0,
  })

  return {
    appName: targetApp, // 子应用名
    collectionName: targetCollection, // collection 名
    action: actionUrl, // 请求的 action URL
    meta: {
      preferredMode, // 推荐使用的模式
      rootApiBase, // 根 API 地址
      appPathApiBase, // 子应用路径 API 地址
    },
    attempts, // 两种模式的结果
  }
}

/**
 * 获取指定子应用下指定 uiSchema 的 JsonSchema（树形结构）。
 * 同时尝试 appHeader 和 appParam 两种模式。
 * @param appName — 子应用名称
 * @param schemaUid — UI Schema 的唯一标识
 * @param params — 额外请求参数
 * @returns 含两种模式结果的 schema 数据
 */
export async function getUISchemaJsonByApplication(
  appName: string, // 子应用名称
  schemaUid: string, // Schema uid
  params?: Record<string, unknown>, // 额外参数
): Promise<Record<string, unknown> | null> {
  // 参数校验
  const targetApp = appName?.trim()
  const targetSchemaUid = schemaUid?.trim()
  if (!targetApp || !targetSchemaUid) {
    getSchemaLog.warn('appName/schemaUid 不能为空')
    return null
  }

  // 获取登录态
  const token = nocoBaseService.getAuthedToken()
  const authedBaseURL = nocoBaseService.getAuthedBaseURL()
  if (!token || !authedBaseURL) {
    getSchemaLog.warn('未找到登录态，请先登录')
    return null
  }

  // 解析 rootApiBase（逻辑同上）
  const normalizedBase = authedBaseURL.trim().replace(/\/+$/, '')
  let rootApiBase: string
  let appPathApiBase: string

  if (normalizedBase.startsWith('/')) {
    rootApiBase = ensureApiBase(normalizedBase)
    const proxyPrefix = rootApiBase.replace(/\/api$/, '')
    appPathApiBase = `${proxyPrefix}/apps/${encodeURIComponent(targetApp)}/api`
  } else if (
    normalizedBase.endsWith('/api') ||
    normalizedBase.includes('/api/')
  ) {
    rootApiBase = normalizedBase.endsWith('/api')
      ? normalizedBase
      : normalizedBase.replace(/\/api\/.*$/, '/api')
    const proxyPrefix = rootApiBase.replace(/\/api$/, '')
    appPathApiBase = `${proxyPrefix}/apps/${encodeURIComponent(targetApp)}/api`
  } else {
    const origin = getOriginFromBaseURL(normalizedBase)
    rootApiBase = ensureApiBase(origin)
    appPathApiBase = `${origin}/apps/${encodeURIComponent(targetApp)}/api`
  }

  // 构建 action URL
  const actionUrl = `uiSchemas:getJsonSchema/${encodeURIComponent(targetSchemaUid)}`
  const finalParams = {
    includeAsyncNode: true, // 包含异步加载的节点
    ...(params || {}),
  }

  getSchemaLog.info('获取 Schema', {
    appName: targetApp,
    schemaUid: targetSchemaUid,
  })

  // 创建客户端
  const byAppHeaderClient = new APIClient({ baseURL: rootApiBase })
  byAppHeaderClient.auth.setToken(token)

  const attempts: Record<string, unknown> = {
    appPath: { data: null, error: { message: 'appPath skipped' } },
    appHeader: { data: null, error: null },
    appParam: { data: null, error: null },
  }

  // appHeader 模式
  try {
    const response = await byAppHeaderClient.request({
      url: actionUrl,
      params: finalParams,
      headers: {
        'x-app': targetApp,
      },
    })
    attempts.appHeader = {
      data: response?.data?.data ?? response?.data ?? response,
      error: null,
    }
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } }
    attempts.appHeader = {
      data: null,
      error: {
        message: err?.message || String(error),
        status: err?.response?.status,
        url: actionUrl,
      },
    }
  }

  // appParam 模式
  try {
    const response = await byAppHeaderClient.request({
      url: actionUrl,
      params: {
        ...finalParams,
        __appName: targetApp,
      },
    })
    attempts.appParam = {
      data: response?.data?.data ?? response?.data ?? response,
      error: null,
    }
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } }
    attempts.appParam = {
      data: null,
      error: {
        message: err?.message || String(error),
        status: err?.response?.status,
        url: actionUrl,
      },
    }
  }

  const preferredMode = (attempts.appHeader as Record<string, unknown>)?.data
    ? 'appHeader'
    : (attempts.appParam as Record<string, unknown>)?.data
      ? 'appParam'
      : 'none'

  getSchemaLog.info('Schema 获取完成', { appName: targetApp, preferredMode })

  return {
    appName: targetApp,
    schemaUid: targetSchemaUid,
    action: actionUrl,
    meta: {
      preferredMode,
      rootApiBase,
      appPathApiBase,
    },
    attempts,
  }
}

// =====================
// 页面标题解析
// =====================

/**
 * 解析翻译模板 {{ t('Title') }} → 'Title'，否则原样返回。
 * 例如 {{ t('用户管理') }} → 用户管理
 * @param raw — 原始标题字符串
 * @returns 解析后的纯文本标题
 */
function normalizeSchemaTitle(raw: string): string {
  // 去除首尾空白
  const trimmed = raw.trim()
  // 匹配 {{ t('xxx') }} 或 {{ t("xxx") }} 格式
  const match = trimmed.match(/^\{\{\s*t\((['"])(.*?)\1\)\s*\}\}$/)
  // 匹配成功则返回翻译 key，否则原样返回
  return match ? (match[2] ?? '').trim() : trimmed
}

/**
 * 从 URL 或路径推导 NocoBase API 的 baseURL。
 * 绝对 URL 从 origin 推导 /api；Electron/Tauri 打包环境用绝对地址。
 * @param urlOrPath — NocoBase 页面 URL 或路径
 * @returns API baseURL
 */
function resolveApiBaseUrl(urlOrPath: string): string {
  const trimmed = urlOrPath.trim()

  // 绝对 URL：从 origin 推导 /api
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return `${new URL(trimmed).origin}/api`
    } catch {
      // URL 解析失败，继续走后续逻辑
    }
  }

  // Tauri 打包环境：Tauri 运行时 + 非 localhost → 无 Vite proxy，需绝对地址直连
  const isPackaged =
    typeof window !== 'undefined' &&
    isTauri() &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  if (isPackaged) {
    // 优先用代理地址
    const proxyUrl = getNocobaseProxyUrl()
    if (
      proxyUrl &&
      (proxyUrl.startsWith('http://') || proxyUrl.startsWith('https://'))
    ) {
      // 如果已有 /api 后缀则原样返回，否则补全
      return proxyUrl.endsWith('/api')
        ? proxyUrl
        : `${proxyUrl.replace(/\/+$/, '')}/api`
    }
    // 其次用直连地址
    const envUrl = getNocobaseUrl()
    if (
      envUrl &&
      (envUrl.startsWith('http://') || envUrl.startsWith('https://'))
    ) {
      return envUrl.endsWith('/api')
        ? envUrl
        : `${envUrl.replace(/\/+$/, '')}/api`
    }
  }

  // Dev / Web 生产：走 Vite proxy 或 Nginx 反代
  return '/nocobase-proxy/api'
}

/**
 * 从环境变量读取指定名称的值。
 * @param name — 环境变量名
 * @returns 字符串值（去空白）
 */
function getEnvString(name: string): string {
  return String(
    (import.meta as unknown as Record<string, Record<string, string>>).env[
      name
    ] || '',
  ).trim()
}

/**
 * 根据 NocoBase 页面 URL 自动获取其标题。
 *
 * 实现方式：
 *   调用 flowModels:findOne?parentId={schemaUid}&subKey=page
 *   从返回的 props.title 提取页面标题。
 *   子应用额外带 x-app header。
 *
 * 支持两种链接格式：
 * - 主应用：  https://xxx/admin/{schemaUid}
 * - 子应用：  https://xxx/apps/{appName}/admin/{schemaUid}
 * - 相对路径：/admin/{schemaUid} 或 /apps/{appName}/admin/{schemaUid}
 *
 * @param urlLike — NocoBase 页面 URL 或路径
 * @returns 页面标题，无法获取时返回 undefined
 */
export async function resolveNocoBasePageTitle(
  urlLike: string,
): Promise<string | undefined> {
  // 去除首尾空白
  const trimmed = urlLike.trim()
  resolveTitleLog.info('开始解析页面标题', { url: trimmed })

  // 空 URL 直接返回
  if (!trimmed) {
    resolveTitleLog.warn('URL 为空，返回 undefined')
    return undefined
  }

  // 1. 从 /admin/{uid} 提取 schemaUid
  const adminMatch = trimmed.match(/\/admin\/([^/?#]+)/)
  if (!adminMatch || !adminMatch[1]) {
    resolveTitleLog.warn('未匹配到 /admin/{uid} 模式')
    return undefined
  }
  const schemaUid = adminMatch[1] // 提取到的 schema uid
  resolveTitleLog.info('提取 schemaUid', { schemaUid })

  // 2. 从 /apps/{appName}/ 提取子应用标识
  const appMatch = trimmed.match(/\/apps\/([^/]+)\//)
  const appName = appMatch?.[1] // 可能为 undefined（主应用）
  if (appName) {
    resolveTitleLog.info('提取 appName', { appName })
  } else {
    resolveTitleLog.info('无子应用标识 → 主应用')
  }

  // 3. 确保已认证客户端
  let client = nocoBaseService.peekAuthedClient()
  if (client) {
    resolveTitleLog.info('复用已有客户端')
  } else {
    resolveTitleLog.info('无已有客户端，尝试管理员登录')
    const apiBase = resolveApiBaseUrl(trimmed)
    resolveTitleLog.info('API baseURL', { apiBase })

    // 尝试环境变量中的管理员账号（用于自动登录获取标题）
    const credentialPairs: Array<{ username: string; password: string }> = [
      {
        username: getEnvString('NOCOBASE_USERNAME'),
        password: getEnvString('NOCOBASE_PASSWORD'),
      },
      {
        username: getEnvString('NOCOBASE_USERNAME2'),
        password: getEnvString('NOCOBASE_PASSWORD2'),
      },
    ]

    let credIndex = 0
    for (const cred of credentialPairs) {
      credIndex++
      // 凭证不完整则跳过
      if (!cred.username || !cred.password) {
        resolveTitleLog.info(`凭证${credIndex} 不完整，跳过`)
        continue
      }
      try {
        resolveTitleLog.info(`尝试凭证${credIndex}`, {
          username: cred.username,
        })
        client = await loginByAccount(apiBase, cred.username, cred.password)
        if (client) {
          resolveTitleLog.info(`凭证${credIndex} 登录成功`)
          break // 登录成功，跳出循环
        }
        resolveTitleLog.info(`凭证${credIndex} 登录返回 null`)
      } catch (err: unknown) {
        const e = err as { message?: string }
        resolveTitleLog.warn(`凭证${credIndex} 登录异常`, { error: e?.message })
      }
    }
  }

  // 仍无客户端则无法继续
  if (!client) {
    resolveTitleLog.warn('所有登录方式均失败，返回 undefined')
    return undefined
  }

  // 4. 调用 flowModels:findOne 获取页面 props 中的 title
  const requestConfig: Record<string, unknown> = {
    url: 'flowModels:findOne', // 查找页面模型
    params: { parentId: schemaUid, subKey: 'page' }, // 按 schemaUid 和 page 子 key 查找
    method: 'get',
  }
  // 子应用场景需带 x-app header
  if (appName) {
    requestConfig.headers = { 'x-app': appName }
  }

  resolveTitleLog.info('请求 flowModels:findOne', {
    schemaUid,
    appName: appName || '(主应用)',
  })

  try {
    const response = await client.request(requestConfig)
    const model = (response?.data?.data || response?.data) as
      Record<string, unknown> | undefined
    resolveTitleLog.info('API 响应', {
      status: response?.status,
      hasData: !!model,
    })

    if (model && typeof model === 'object') {
      // 提取 props.title
      const propsTitle =
        model?.props && typeof model.props === 'object'
          ? (model.props as Record<string, unknown>).title // props.title 字段
          : undefined
      resolveTitleLog.info('props.title', { title: propsTitle })

      // title 有效则处理翻译模板
      if (typeof propsTitle === 'string' && propsTitle.trim()) {
        const finalTitle = normalizeSchemaTitle(propsTitle) // 解析 {{ t('xxx') }} 模板
        resolveTitleLog.info('标题解析完成', { title: finalTitle })
        return finalTitle
      }

      resolveTitleLog.info('props.title 无效', {
        modelKeys: Object.keys(model).slice(0, 10),
      })
    }
  } catch (err: unknown) {
    const e = err as { message?: string }
    resolveTitleLog.warn('API 请求异常', { error: e?.message })
  }

  // 未能提取到标题
  resolveTitleLog.warn('未能提取标题，返回 undefined')
  return undefined
}
