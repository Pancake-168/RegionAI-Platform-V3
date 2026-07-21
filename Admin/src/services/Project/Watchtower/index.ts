import type { ApiResult } from '@/types/ApiResult'
import { SystemStorageManager } from '@/utils/SystemStorage'
import { createLogger } from '@/utils/logger'

import { API_URLS } from '@/apiUrls'

// 启动容器接口返回的容器信息
export type ContainerStartResponse = {
  container_id: string
  name: string
  status: string
}

// 停止容器接口返回的信息
export type ContainerStopResponse = {
  message: string
}

// 获取容器日志接口返回的信息
export type ContainerLogsResponse = {
  logs: string
}

// 获取容器状态接口返回的信息
export type ContainerStatusResponse = {
  user_id: string
  container_id: string
  name: string
  status: string
  image: string
}

// 列出所有容器接口返回的信息
export type ContainerListItem = {
  name: string
  status: string
}

export type ContainerListResponse = {
  containers: ContainerListItem[]
  total: number
}

// 共享鉴权：优先使用外部传入的 token 和 username，否则走 SystemStorageManager
async function resolveAuth(
  tokenOverride?: string,
  usernameOverride?: string,
): Promise<ApiResult<{ username: string; token: string }>> {
  const username = usernameOverride || (await SystemStorageManager.getActiveUsername())
  if (!username) {
    return { ok: false, data: null, error: '未获取到用户名' }
  }
  const token = tokenOverride || (await SystemStorageManager.getLoginToken(username)) || ''
  if (!token) {
    return { ok: false, data: null, error: '未获取到有效token' }
  }
  return { ok: true, data: { username, token } }
}

// 通用容器 API 调用
async function callContainerApi<T>(
  fnName: string,
  urlBuilder: (username: string) => string,
  method: string,
  tokenOverride?: string,
  usernameOverride?: string,
): Promise<ApiResult<T>> {
  const log = createLogger('Watchtower/index.ts', fnName)
  const auth = await resolveAuth(tokenOverride, usernameOverride)
  if (!auth.ok) {
    log.error(auth.error)
    return { ok: false, data: null, error: auth.error ?? '未知错误' }
  }
  const { username, token } = auth.data!
  let error: string | undefined
  try {
    log.info('开始调用', { username })
    const res = await fetch(urlBuilder(username), {
      method,
      headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = (await res.json()) as T
      log.info('调用成功', data)
      return { ok: true, data }
    }
    error = `HTTP ${res.status}`
  } catch (e) {
    log.error('调用失败', e)
    error = String(e)
  }
  return { ok: false, data: null, error: error ?? '未知错误' }
}

// 启动容器
export async function StartContainer(
  tokenOverride?: string,
  usernameOverride?: string,
): Promise<ApiResult<ContainerStartResponse>> {
  return callContainerApi('StartContainer', API_URLS.StartContainer, 'POST', tokenOverride, usernameOverride)
}

// 停止容器
export async function StopContainer(
  tokenOverride?: string,
  usernameOverride?: string,
): Promise<ApiResult<ContainerStopResponse>> {
  return callContainerApi('StopContainer', API_URLS.StopContainer, 'POST', tokenOverride, usernameOverride)
}

// 重启容器
export async function RestartContainer(
  tokenOverride?: string,
  usernameOverride?: string,
): Promise<ApiResult<ContainerStopResponse>> {
  return callContainerApi('RestartContainer', API_URLS.RestartContainer, 'POST', tokenOverride, usernameOverride)
}

// 移除容器
export async function RemoveContainer(
  tokenOverride?: string,
  usernameOverride?: string,
): Promise<ApiResult<ContainerStopResponse>> {
  return callContainerApi('RemoveContainer', API_URLS.RemoveContainer, 'DELETE', tokenOverride, usernameOverride)
}

// 获取容器日志
export async function GetContainerLogs(
  tokenOverride?: string,
  usernameOverride?: string,
): Promise<ApiResult<ContainerLogsResponse>> {
  return callContainerApi('GetContainerLogs', API_URLS.GetContainerLogs, 'GET', tokenOverride, usernameOverride)
}

// 获取容器状态
export async function GetContainerStatus(
  tokenOverride?: string,
  usernameOverride?: string,
): Promise<ApiResult<ContainerStatusResponse>> {
  return callContainerApi('GetContainerStatus', API_URLS.GetContainerStatus, 'GET', tokenOverride, usernameOverride)
}

// 列出所有容器（无需认证）
export async function ListContainers(): Promise<ApiResult<ContainerListResponse>> {
  const log = createLogger('Watchtower/index.ts', 'ListContainers')
  let error: string | undefined
  try {
    log.info('开始列出所有容器')
    const res = await fetch(API_URLS.ListContainers(), {
      method: 'GET',
      headers: { accept: 'application/json' },
    })
    if (res.ok) {
      const data = (await res.json()) as ContainerListResponse
      log.info('容器列表获取成功', { total: data.total })
      return { ok: true, data }
    }
    error = `HTTP ${res.status}`
  } catch (e) {
    log.error('容器列表获取失败', e)
    error = String(e)
  }
  return { ok: false, data: null, error: error ?? '未知错误' }
}
