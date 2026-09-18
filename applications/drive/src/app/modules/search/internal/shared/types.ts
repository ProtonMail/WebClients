import type { PermanentErrorKind } from './errors';

export type UserId = string & { readonly __brand: 'SearchUserId' };
export type ClientId = string & { readonly __brand: 'SearchClientId' };
export type TreeEventScopeId = string & { readonly __brand: 'TreeEventScopeId' };

export const brandSearchUserId = (id: string): UserId => {
    if (typeof id !== 'string' || id.length === 0) {
        throw new Error('brandSearchUserId: expected a non-empty string');
    }
    return id as UserId;
};

export const brandTreeEventScopeId = (id: string): TreeEventScopeId => {
    if (typeof id !== 'string') {
        throw new Error('brandTreeEventScopeId: expected string');
    }
    return id as TreeEventScopeId;
};

export type IndexingProgress = {
    files: number;
    folders: number;
    albums: number;
    photos: number;
};

export type IndexPopulatorStatus = {
    done: boolean;
    progress: IndexingProgress;
    // True once this populator's index has hit SEARCH_MAX_INDEXED_DOCUMENTS - either the initial
    // walk stopped early, or an eviction sweep has removed entries. Sticky: only cleared by
    // markAsNotDone (a fresh indexing campaign), never by index entry count dropping back down.
    capped: boolean;
};

export type SearchModuleState = {
    // Whether the user has opted in to the search experience.
    isUserOptIn: boolean;
    // Whether a full index scan is in progress (bootstrap or reindex).
    isIndexing: boolean;
    // Whether this tab is running an outdated app version compared to another tab.
    isRunningOutdatedVersion: boolean;
    // Whether a usable index exists in client DB.
    isSearchable: boolean;
    // If non-null, a permanent error has stopped the processor.
    permanentError: PermanentErrorKind | null;
    // Per-populator status (progress, done, version) for UI and maintenance.
    indexPopulatorStatuses: IndexPopulatorStatus[];
    // True once any populator's index has been capped (initial walk hard-stop or eviction sweep).
    // Sticky, mirrors IndexPopulatorStatus.capped - drives the "Search recent items" UI.
    isIndexPartial: boolean;
    // Whether the user has permanently dismissed the one-time "partial index" notice. A user
    // preference, not indexer state - read once at init from the worker/DB and updated locally
    // on dismissal, rather than riding the SharedWorker's state broadcast (see SearchModule).
    isPartialIndexNoticeDismissed: boolean;
};

type AttributeFilter = string | bigint | boolean;

export enum IndexKind {
    // The main default index: My files.
    MAIN = 'main',

    // TODO: Add more indices as needed (e.g. Devices, Photos, Shared with me, ...)
}

/**
 * Discriminator for the kind of indexer task. Used as a Sentry tag and as
 * routing metadata in `searchMetrics`. Each `BaseTask` subclass implements
 * `getKind()` to return its value.
 */
export type IndexerTaskKind =
    | 'index-populator-task'
    | 'incremental-update-task'
    | 'cleanup-stale-blobs-task'
    | 'cleanup-stale-index-entries-task'
    | 'evict-index-entries-task'
    | 'persist-data-task'
    | 'remove-tree-event-scope-id-task'
    | 'repair-failed-nodes-task';

export type SearchQuery = {
    filename: string;
    filters?: Record<string, AttributeFilter>;
};

export type SearchResultItem = {
    nodeUid: string;
    score: number;
    indexKind: IndexKind;
};

/**
 * Discriminated union for streaming search results across the Comlink boundary
 * from the shared worker to the main thread.
 */
export type WorkerSearchResultEvent = ({ type: 'item' } & SearchResultItem) | { type: 'done' };

// Possible values for an index entry attribute once it has been returned by the WASM library
// via `Entry.attribute(name)[i].value()`. Integers may come back as either `number` or `bigint`
// depending on magnitude; strings cover both `text` and `tag` attribute kinds.
export type SerializedAttributeValue = string | number | bigint | boolean;

export type SerializedIndexEntry = {
    identifier: string;
    attributes: Record<string, SerializedAttributeValue[]>;
};

/**
 * Discriminated union for streaming exported index entries across the Comlink
 * boundary. Used by the diagnostics modal.
 */
export type WorkerIndexExportEvent = ({ type: 'entry' } & SerializedIndexEntry) | { type: 'done' };
