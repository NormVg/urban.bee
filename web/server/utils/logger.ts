/** Minimal namespaced logger so server logs stay greppable. */
export const logger = {
  info: (scope: string, message: string, data?: unknown) =>
    console.info(`[${scope}] ${message}`, data ?? ''),
  warn: (scope: string, message: string, data?: unknown) =>
    console.warn(`[${scope}] ${message}`, data ?? ''),
  error: (scope: string, message: string, error?: unknown) =>
    console.error(`[${scope}] ${message}`, error ?? ''),
}
