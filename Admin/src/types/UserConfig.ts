export type UserTheme = 'light' | 'dark' | 'light-blue'
export type FunctionListMode = 'drawer' | 'fixed'
export type DisplayScale = 0.5 | 0.75 | 0.9 | 1 | 1.1 | 1.25 | 1.5 | 1.75 | 2

/** 收件箱事件条目 — EventCenter 和 EventInboxStore 共用 */
export interface EventInboxEntry {
  event_id: string // 事件 UUID，与 Socket.IO 推送和 GetLog 的 event_id 一致，去重键
  appid: string // 组织 appid，调 GetLog 查详情时必须传（多组织场景下用条目自身取值）
  occurred_at: string // ISO 时间戳，排序依据
  message: string // 摘要文本，直接用于通知列表渲染
  executed: boolean // 是否已执行处理任务（客户端人为标记，同步到 UserConfig）
}

/** 事件收件箱持久化结构 — 写入 UserConfig.eventInbox */
export interface EventInboxConfig {
  entries: EventInboxEntry[] // 按 occurred_at 倒序，最新在前
}

export interface UserConfig {
  theme?: UserTheme
  language?: string
  currentOrg?: string
  organizationAIAdminRooms?: Record<string, string>
  aiSupportRooms?: string[]
  functionListMode?: FunctionListMode
  functionListCollapsed?: boolean
  notificationSoundEnabled?: boolean
  openAtLogin?: boolean
  displayScale?: DisplayScale
  hideAppOnScreenshot?: boolean
  onboardingCompleted?: boolean
  workbench?: import('@/views/views/Pages/WorkbenchPageV2/constants').WorkbenchConfig
  eventInbox?: EventInboxConfig
}
