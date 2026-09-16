export type ContentSearchVersion = 'v1' | 'v2';

export const SEARCH_VERSION_V1: ContentSearchVersion = 'v1';
export const SEARCH_VERSION_V2: ContentSearchVersion = 'v2';

export type ContentSearchEndReason = 'newSearch' | 'clearField' | 'navigation';

export type ContentSearchResultAction =
    'reply' | 'delete' | 'forward' | 'move' | 'label' | 'star' | 'unstar' | 'read' | 'unread' | 'other';

export type ContentSearchActionSurface = 'result_list' | 'opened_message';

/**
 * `firstActionType` on a session can be a result open, which isn't one of the `ContentSearchResultAction`
 * values reported by `sendResultActionReport` (opening has its own `result_opened` event).
 */
export type ContentSearchSessionActionType = ContentSearchResultAction | 'open';

export type ContentSearchScrollerMode = 'message' | 'conversation';

/**
 * `isConversationMode()` (mail's `helpers/mailSettings.ts`) forces message view whenever a search
 * is active, regardless of the user's `ViewMode` setting, so search results are never grouped as
 * conversations today. Every search-related event hardcodes this instead of reading conversation
 * mode from state; kept as a dimension for schema parity with mobile, where it may actually vary.
 */
export const SEARCH_RESULT_SCROLLER_MODE: ContentSearchScrollerMode = 'message';

/**
 * One search session covers exactly one search: pagination, sort, and filter changes re-run the
 * search but don't close it. Owned by the `MetricService` instance for the session's lifetime
 * (`startSearchSession`/`endSearchSession`), not a standalone store.
 */
export interface SearchSession {
    startedAt: number;
    hasResults: boolean;
    scrollerMode?: ContentSearchScrollerMode;
    resultsOpened: number;
    actionsPerformed: number;
    firstActionType?: ContentSearchSessionActionType;
    firstOpenedPosition?: number;
    firstActionAt?: number;
}

export type ContentSearchPrimaryMatchType = 'sender' | 'subject' | 'body' | 'unknown';

/** No per-field match info is tracked for search results today, on either engine. */
export const SEARCH_RESULT_PRIMARY_MATCH_TYPE: ContentSearchPrimaryMatchType = 'unknown';

/**
 * Composition of the account's addresses: all Proton-domain, all BYOE, or a mix of both.
 */
export type ContentSearchMailboxAddressType = 'proton' | 'byoe' | 'mixed';
