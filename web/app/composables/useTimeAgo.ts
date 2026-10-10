/** "5 min ago" style relative time, refreshed each minute on the client. */
const RTF = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatTimeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return 'just now'
  if (abs < 3600) return RTF.format(Math.round(seconds / 60), 'minute')
  if (abs < 86_400) return RTF.format(Math.round(seconds / 3600), 'hour')
  if (abs < 86_400 * 30) return RTF.format(Math.round(seconds / 86_400), 'day')
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function useTimeAgo(source: MaybeRefOrGetter<string>) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    timer = setInterval(() => (now.value = Date.now()), 60_000)
  })
  onBeforeUnmount(() => clearInterval(timer))
  return computed(() => formatTimeAgo(toValue(source), now.value))
}
