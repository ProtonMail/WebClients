export type UserId = string & { readonly __brand: 'SearchUserId' };
export type ClientId = string & { readonly __brand: 'SearchClientId' };
export type TreeEventScopeId = string & { readonly __brand: 'TreeEventScopeId' };

export const brandTreeEventScopeId = (id: string): TreeEventScopeId => {
    return id as TreeEventScopeId;
};

export type SearchModuleState = {
    // Whether the initial scan is in progress (building index from scratch).
    isInitialIndexing: boolean;
    // Whether any indexing is in progress (initial or incremental).
    isIndexing: boolean;
    // Whether the search module is ready to receive any search queries.
    isSearchable: boolean;
    // Whether this tab is running an outdated app version compared to another tab.
    isRunningOutdatedVersion: boolean;
    // If non-null, a permanent error has stopped the processor.
    permanentError: 'quota_exceeded' | 'corrupted_db' | null;
};

export type AttributeFilter = string | bigint | boolean;

export type SearchQuery = {
    filename: string;
    filters?: Record<string, AttributeFilter>;
};

export type SearchResultItem = {
    nodeUid: string;
    score: number;
    indexKind: string;
};

/**
 * Discriminated union for streaming search results across the Comlink boundary
 * from the shared worker to the main thread.
 */
export type WorkerSearchResultEvent = ({ type: 'item' } & SearchResultItem) | { type: 'done' };
