/**
 * `useEncryptedSearch` (v1, this package) and `MetricService` (v2, mail's `contentSearch` module) share
 * these two types so both report the same dimension values. Once v1 is retired, move them into mail's
 * `contentSearch/metrics/interface.ts` alongside the rest of the content-search telemetry types.
 */

export type ContentSearchEventStatus = 'success' | 'error';

/**
 * `errorKind` on `mailbox_index_completed` (measurement_group `mail.any.search_index`) is an
 * `allowed_values` dimension there, unlike the free-text `errorKind` on `mail.any.search`'s events.
 */
export type ContentSearchIndexErrorKind =
    | 'network_offline'
    | 'task_cancelled'
    | 'api_error'
    | 'crypto_error'
    | 'prepare_error'
    | 'storage_error'
    | 'index_write_error'
    | 'other';
