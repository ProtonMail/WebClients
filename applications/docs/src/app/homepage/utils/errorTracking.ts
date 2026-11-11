/** The host's error tracking (Sentry), injected. Never pass private or sensitive information. */
export type ErrorTracking = {
  traceError: (error: unknown, details?: { tags?: Record<string, string> }) => void
  addBreadcrumb: (breadcrumb: {
    category: string
    level: 'info' | 'warning'
    message: string
    data?: Record<string, unknown>
  }) => void
  /** False for errors the host never reports, such as aborts and connection issues. */
  isReportable: (error: unknown) => boolean
}

/** The value of SentryRealtimeInitiatives.SDK_SWITCH in packages/shared/lib/helpers/sentry.ts */
export const SDK_SWITCH_INITIATIVE = 'realtime-sdk-switch'
