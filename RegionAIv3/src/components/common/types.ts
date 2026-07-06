export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  icon?: any
}

export interface MenuItem {
  label: string
  icon?: any
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  separator?: true
  onClick?: () => void
}

export interface TabItem {
  id: string
  label: string
  icon?: any
  content: any
}

export type ToastVariant = 'success' | 'error' | 'warn' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastInstance {
  id: string
  message: string
  variant?: ToastVariant
  duration?: number
  action?: ToastAction
}
