import { ValidationError } from '@protontech/drive-sdk'
import { SDK_SWITCH_INITIATIVE, type ErrorTracking } from '../utils/errorTracking'

// Errors from Drive SDK are missing stack trace from our app so we wrap it
export function traceErrorSDK(errorTracking: ErrorTracking, error: any, feature: string) {
  // Wrapping hides error name from Sentry's ignoreErrors (e.g. AbortError), so filter before
  if (!errorTracking.isReportable(error) || error instanceof ValidationError) {
    return
  }
  const errorWithCurrentStack = new Error(error?.message ?? 'Failed while calling Drive SDK')
  errorWithCurrentStack.cause = error
  errorTracking.traceError(errorWithCurrentStack, {
    tags: {
      initiative: SDK_SWITCH_INITIATIVE,
      feature,
    },
  })
}
