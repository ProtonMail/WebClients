/**
 * Shared with mobile's Content Search telemetry schema (measurement_group `mail.any.search` /
 * `mail.any.search_index`). Exposed here so v1 (this package) and v2 (mail's class-based contentSearch
 * module) emit the exact same dimension values instead of drifting apart.
 */

export type ContentSearchVersion = 'v1' | 'v2';

/**
 * Composition of the account's addresses: all Proton-domain, all BYOE, or a mix of both.
 */
export type ContentSearchMailboxAddressType = 'proton' | 'byoe' | 'mixed';

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

export type ContentSearchScrollerMode = 'message' | 'conversation';

/**
 * `isConversationMode()` (mail's `helpers/mailSettings.ts`) forces message view whenever a search
 * is active, regardless of the user's `ViewMode` setting, so search results are never grouped as
 * conversations today. Every search-related event hardcodes this instead of reading conversation
 * mode from state; kept as a dimension for schema parity with mobile, where it may actually vary.
 */
export const SEARCH_RESULT_SCROLLER_MODE: ContentSearchScrollerMode = 'message';

export type ContentSearchPrimaryMatchType = 'sender' | 'subject' | 'body' | 'unknown';

export type ContentSearchResultAction =
    'reply' | 'delete' | 'forward' | 'move' | 'label' | 'star' | 'unstar' | 'read' | 'unread' | 'other';

export type ContentSearchActionSurface = 'result_list' | 'opened_message';

// TODO how do we integrate the appSwitch and tabClose?
export type ContentSearchEndReason = 'newSearch' | 'clearField' | 'navigation';

/**
 * `firstActionType` on a session can be a result open, which isn't one of the `ContentSearchResultAction`
 * values reported by `sendResultActionReport` (opening has its own `result_opened` event).
 */
export type ContentSearchSessionActionType = ContentSearchResultAction | 'open';
