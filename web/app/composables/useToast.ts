export interface Toast {
  id: number
  tone: 'success' | 'danger' | 'info'
  message: string
}

/** App-wide toasts rendered by <UiToaster /> in the dashboard layout. */
export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function notify(toast: Omit<Toast, 'id'>, durationMs = 3200) {
    const id = Date.now() + Math.random()
    toasts.value = [...toasts.value, { ...toast, id }]
    setTimeout(() => dismiss(id), durationMs)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, notify, dismiss }
}
