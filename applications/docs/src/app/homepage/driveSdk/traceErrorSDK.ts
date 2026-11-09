import { ValidationError } from '@protontech/drive-sdk'
import { getSentryError, SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'

// Errors from Drive SDK are missing stack trace from our app so we wrap it
export function traceErrorSDK(error: any, feature: string) {
  // Wrapping hides error name from Sentry's ignoreErrors (e.g. AbortError), so filter before
  if (!getSentryError(error) || error instanceof ValidationError) {
    return
  }
  const errorWithCurrentStack = new Error(error?.message ?? 'Failed while calling Drive SDK')
  errorWithCurrentStack.cause = error
  traceError(errorWithCurrentStack, {
    tags: {
      initiative: SentryRealtimeInitiatives.SDK_SWITCH,
      feature,
    },
  })
}
