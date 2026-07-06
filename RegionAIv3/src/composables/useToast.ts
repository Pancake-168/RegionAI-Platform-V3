import { ref, readonly, onMounted, onUnmounted } from 'vue'
import type { ToastInstance, ToastVariant } from '@/components/common/types'

let toastListeners: Array<(toast: ToastInstance) => void> = []
let toastCounter = 0

function notifyListeners(toast: ToastInstance) {
  for (const fn of toastListeners) {
    fn(toast)
  }
}

export function toast(
  messageOrConfig: string | Omit<ToastInstance, 'id'>,
  variant?: ToastVariant,
): void {
  const config =
    typeof messageOrConfig === 'string'
      ? { message: messageOrConfig, variant }
      : messageOrConfig

  notifyListeners({
    id: `toast-${++toastCounter}`,
    variant: 'info',
    duration: 3000,
    ...config,
  })
}

export function useToastViewport() {
  const toasts = ref<ToastInstance[]>([])
  let listener: ((t: ToastInstance) => void) | null = null

  onMounted(() => {
    listener = (t: ToastInstance) => {
      toasts.value = [...toasts.value, t]
    }
    toastListeners.push(listener)
  })

  onUnmounted(() => {
    if (listener) {
      toastListeners = toastListeners.filter((fn) => fn !== listener)
    }
  })

  function removeToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts: readonly(toasts), removeToast }
}
