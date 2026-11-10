type TraceError = (error: any, details: Record<string, any>) => void

export function traceRecentsError(traceError: TraceError, error: any) {
  traceError(error, {
    tags: {
      initiative: 'realtime-sdk-switch',
      feature: 'DocsLoadRecentsWithDriveSDK',
    },
  })
}
