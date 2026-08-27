import { SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'

// Errors from Drive SDK are missing stack trace from our app so we wrap it
export function traceErrorSDK(error: any, feature: string) {
  const errorWithCurrentStack = new Error(error?.message ?? 'Failed while calling Drive SDK')
  errorWithCurrentStack.cause = error
  traceError(errorWithCurrentStack, {
    tags: {
      initiative: SentryRealtimeInitiatives.SDK_SWITCH,
      feature,
    },
  })
}
