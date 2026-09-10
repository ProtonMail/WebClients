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

export type ContentSearchScrollerMode = 'message' | 'conversation';

export type ContentSearchPrimaryMatchType = 'sender' | 'subject' | 'body' | 'unknown';

export type ContentSearchResultAction =
    'reply' | 'delete' | 'forward' | 'move' | 'label' | 'star' | 'unstar' | 'read' | 'unread' | 'other';

export type ContentSearchActionSurface = 'result_list' | 'opened_message';

// TODO how do we integrate the appSwitch and tabClose?
export type ContentSearchEndReason = 'newSearch' | 'clearField' | 'navigation' | 'appSwitch' | 'tabClose';
