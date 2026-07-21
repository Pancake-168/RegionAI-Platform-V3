import type { ApiResult } from '@/types/ApiResult'
import { nocoBaseService } from '@/services/NocoBase/client'
import { getCollectionDataByApplication } from '@/services/NocoBase/data/info'
import { createLogger } from '@/utils/logger'

const log = createLogger('CopyToken.ts', 'copyToken')

// 根据 username 从 SSO System 应用中查询并获取 token
// 流程：
// 1. 查询 a_account 表，按 username 过滤
// 2. 取 openid
// 3. 查询 a_login_session 表，按 openid 过滤
// 4. 取 token
export async function getTokenByUsername(
  username: string,
): Promise<ApiResult<string>> {
  let error: string | undefined

  const trimmed = username?.trim()
  if (!trimmed) {
    error = 'username 不能为空'
    log.error(error)
    return { ok: false, data: null, error }
  }

  const token = nocoBaseService.getAuthedToken()
  if (!token) {
    error = '未找到登录态，请先登录'
    log.error(error)
    return { ok: false, data: null, error }
  }

  const SSO_APP_NAME = 'A_SYSTEM_SSO'

  try {
    // 第 1-2 步：查询 a_account 表，按 username 过滤
    log.info('查询 a_account', { username: trimmed })
    const accountResult = await getCollectionDataByApplication(
      SSO_APP_NAME,
      'a_account',
      { filter: { username: trimmed }, pageSize: 1 },
    )
    // 提取数据：优先 appHeader，其次 appParam
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = accountResult as any
    const accountData = raw?.attempts
    const preferredAccountData =
      accountData?.appHeader?.data || accountData?.appParam?.data
    const accountList: Array<Record<string, unknown>> = Array.isArray(
      preferredAccountData,
    )
      ? preferredAccountData
      : preferredAccountData?.data || []
    if (accountList.length === 0) {
      error = `未找到用户 ${trimmed} 的 a_account 记录`
      log.error(error)
      return { ok: false, data: null, error }
    }
    const account = accountList[0]!
    const openid = account.openid as string | undefined
    if (!openid) {
      error = `用户 ${trimmed} 的 a_account 记录缺少 openid`
      log.error(error)
      return { ok: false, data: null, error }
    }
    log.info('获取到 openid', { username: trimmed, openid })

    // 第 3-4 步：查询 a_login_session 表，按 openid 过滤
    log.info('查询 a_login_session', { openid })
    const sessionResult = await getCollectionDataByApplication(
      SSO_APP_NAME,
      'a_login_session',
      { filter: { openid }, pageSize: 1 },
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawSession = sessionResult as any
    const sessionData = rawSession?.attempts
    const preferredSessionData =
      sessionData?.appHeader?.data || sessionData?.appParam?.data
    const sessionList: Array<Record<string, unknown>> = Array.isArray(
      preferredSessionData,
    )
      ? preferredSessionData
      : preferredSessionData?.data || []
    if (sessionList.length === 0) {
      error = `未找到 openid ${openid} 的 a_login_session 记录`
      log.error(error)
      return { ok: false, data: null, error }
    }
    const session = sessionList[0]!
    const sessionToken = session.token as string | undefined
    if (!sessionToken) {
      error = `openid ${openid} 的 a_login_session 记录缺少 token`
      log.error(error)
      return { ok: false, data: null, error }
    }
    log.info('获取 token 成功', { username: trimmed })
    return { ok: true, data: sessionToken }
  } catch (e) {
    error = String(e)
    log.error('获取 token 失败', e)
    return { ok: false, data: null, error }
  }
}

// 从 SSO System 的 a_account 表获取所有用户的 username → atype 映射
// 返回 Record<username, atype>，atype 为 'user' | 'bot'
export async function getAllAccountTypes(): Promise<
  ApiResult<Record<string, string>>
> {
  let error: string | undefined

  const token = nocoBaseService.getAuthedToken()
  if (!token) {
    error = '未找到登录态，请先登录'
    log.error(error)
    return { ok: false, data: null, error }
  }

  const SSO_APP_NAME = 'A_SYSTEM_SSO'

  try {
    log.info('查询所有 a_account')
    const result = await getCollectionDataByApplication(
      SSO_APP_NAME,
      'a_account',
      { pageSize: 500 },
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = result as any
    const data = raw?.attempts
    const preferred = data?.appHeader?.data || data?.appParam?.data
    const list: Array<Record<string, unknown>> = Array.isArray(preferred)
      ? preferred
      : preferred?.data || []

    const map: Record<string, string> = {}
    for (const item of list) {
      const uname = item.username as string | undefined
      const atype = item.atype as string | undefined
      if (uname && atype) {
        map[uname] = atype
      }
    }
    log.info('a_account 类型映射构建完成', { count: Object.keys(map).length })
    return { ok: true, data: map }
  } catch (e) {
    error = String(e)
    log.error('获取 a_account 类型失败', e)
    return { ok: false, data: null, error }
  }
}
