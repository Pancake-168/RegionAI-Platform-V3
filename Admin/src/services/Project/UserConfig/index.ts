import type { UserConfig } from '@/types/UserConfig'

import type { ApiResult } from '@/types/ApiResult'
import { SystemStorageManager } from '@/utils/SystemStorage'
import { createLogger } from '@/utils/logger'

import { API_URLS } from '@/apiUrls'

export async function GetUserConfig(): Promise<ApiResult<UserConfig | null>> {
  const log = createLogger('UserConfig.ts', 'GetUserConfig')
  let error: string | undefined

  const activeUsername = await SystemStorageManager.getActiveUsername()
  if (!activeUsername) {
    error = '未获取到当前激活账号用户名，无法获取当前用户配置'
    log.error(error)
    return { ok: false, data: null, error: error ?? '未知错误' }
  }
  const token = (await SystemStorageManager.getLoginToken(activeUsername)) || ''
  if (!token) {
    error = '未获取到有效token，无法获取当前用户配置'
    log.error(error)
    return { ok: false, data: null, error: error ?? '未知错误' }
  }
  try {
    log.info('开始获取用户配置')
    const apiurl = API_URLS.GetUserConfig()
    const res = await fetch(apiurl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    if (res.ok) {
      const data = (await res.json()) as UserConfig
      log.info('获取用户配置成功', data)
      return { ok: true, data }
    }
    error = `HTTP ${res.status}`
  } catch (e) {
    log.error('获取当前用户配置失败', e)
    error = String(e)
  }
  return { ok: false, data: null, error: error ?? '未知错误' }
}
