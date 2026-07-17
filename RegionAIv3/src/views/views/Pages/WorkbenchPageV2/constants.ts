export interface WorkbenchConfig {
  items: WorkbenchItem[]
}

// ── 工作台条目类型 ──────────────────────────────────────
export type WorkbenchItemType = 'builtin' | 'url'

export interface WorkbenchItem {
  id: string // uuid
  type: WorkbenchItemType
  title: string // 用户自定义标题
  icon: string // iconify 格式 "iconSet:iconName"
  pinned: boolean // true=自定义区, false=功能池
  sortOrder: number // 排序序号
  functionId?: string // type='builtin' 时关联 BuiltinFunction.id
  embedUrl?: string // type='url' 时 iframe 内嵌 URL
  width?: number // 卡片像素宽度，未设置时使用默认值
  height?: number // 卡片像素高度，未设置时使用默认值
}
