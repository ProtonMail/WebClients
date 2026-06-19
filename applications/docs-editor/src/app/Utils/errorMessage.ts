import type { ErrorInfo } from 'react'
import { traceError } from '@proton/shared/lib/helpers/sentry'

export const reportErrorToSentry = (error: unknown, errorInfo?: ErrorInfo, extra: Record<string, unknown> = {}) => {
  console.error(error, errorInfo)

  traceError(error, {
    tags: {
      editor: true,
    },
    extra: {
      ...extra,
      errorInfo: errorInfo ?? {},
    },
  })
}
