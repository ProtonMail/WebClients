import { SDK_SWITCH_INITIATIVE, type ErrorTracking } from './utils/errorTracking'

export function traceRecentsError(errorTracking: ErrorTracking, error: any) {
  errorTracking.traceError(error, {
    tags: {
      initiative: SDK_SWITCH_INITIATIVE,
      feature: 'DocsLoadRecentsWithDriveSDK',
    },
  })
}
