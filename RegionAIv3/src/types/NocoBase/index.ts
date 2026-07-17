// NocoBase 相关类型定义

// 服务器选项：下拉列表中的每一项
export interface NocoBaseServerOption {
  key: string // 唯一标识，如 'dev-proxy'
  label: string // 显示文本，如 '开发环境代理 (/nocobase-proxy/api)'
  baseURL: string // API 基础地址，如 '/nocobase-proxy/api'
}

// 探测请求项：批量探测时的一条请求定义
export interface ProbeItem {
  key: string // 探测结果存储用的 key，如 'users'
  url: string // NocoBase SDK 的 resource:action 格式 URL，如 'users:list'
  params?: Record<string, unknown> // 可选的请求参数
}

// 通用 NocoBase 记录类型
export type NocoRecord = Record<string, unknown>

// Collection 记录类型
export type NocoCollectionRecord = Record<string, unknown>
