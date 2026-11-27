import { ValidationError } from '@proton/drive/sdk'
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper'
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors'
import { getSentryError, SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'

// Errors from Drive SDK are missing stack trace from our app so we wrap it
/**
 * Call only from a `catch` block inside an `async` function that awaited the failing call.
 * Never from `.then(_, onError)` or `.catch(callback)`: there V8 has no async caller,
 * so the Docs call site is missing from the Sentry stack.
 */
export function traceErrorSDK(error: any, feature: string) {
  // Wrapping hides error name from Sentry's ignoreErrors (e.g. AbortError), so filter before
  if (!getSentryError(error) || error instanceof ValidationError) {
    return
  }
  const errorWithCurrentStack = new Error(
    getApiError(error).message || error?.message || 'Failed while calling Drive SDK',
  )
  errorWithCurrentStack.cause = error
  traceError(errorWithCurrentStack, {
    tags: {
      initiative: SentryRealtimeInitiatives.SDK_SWITCH,
      feature,
    },
  })
}

export function reportPublicDriveError(error: unknown) {
  const isNotFound = error instanceof ValidationError && error.code === API_CUSTOM_ERROR_CODES.NOT_FOUND
  if (!isNotFound) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
  }
}
