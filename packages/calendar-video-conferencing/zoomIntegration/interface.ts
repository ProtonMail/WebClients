export type ZoomIntegrationState =
    | 'loadingConfig'
    | 'disconnected'
    | 'disconnected-error'
    | 'connected'
    | 'loading'
    | 'meeting-present'
    | 'meeting-deleted'
    | 'zoom-reconnection-error';
