import { ValidationError } from '@protontech/drive-sdk'
import { SDK_SWITCH_INITIATIVE, type ErrorTracking } from '../utils/errorTracking'

// Errors from Drive SDK are missing stack trace from our app so we wrap it
/**
 * Call only from a `catch` block inside an `async` function that awaited the failing call.
 * Never from `.then(_, onError)` or `.catch(callback)`: there V8 has no async caller,
 * so the Docs call site is missing from the Sentry stack.
 */
export function traceErrorSDK(errorTracking: ErrorTracking, error: any, feature: string) {
  // Wrapping hides error name from Sentry's ignoreErrors (e.g. AbortError), so filter before
  if (!errorTracking.isReportable(error) || error instanceof ValidationError) {
    return
  }
  // An API error's message is its HTTP status text, often empty: the backend's own message is in data.Error
  const errorWithCurrentStack = new Error(error?.data?.Error || error?.message || 'Failed while calling Drive SDK')
  errorWithCurrentStack.cause = error
  errorTracking.traceError(errorWithCurrentStack, {
    tags: {
      initiative: SDK_SWITCH_INITIATIVE,
      feature,
    },
  })
}
