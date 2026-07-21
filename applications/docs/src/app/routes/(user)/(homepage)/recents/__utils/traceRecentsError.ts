import { SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'

export function traceRecentsError(error: any) {
  traceError(error, {
    tags: {
      initiative: SentryRealtimeInitiatives.SDK_SWITCH,
      feature: 'DocsLoadRecentsWithDriveSDK',
    },
  })
}
