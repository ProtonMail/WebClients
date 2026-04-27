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
};

export type SearchModuleState = {
    // Whether the user has opted in to the search experience.
    isUserOptIn: boolean;
    // Whether the initial scan is in progress (building index from scratch).
    isInitialIndexing: boolean;
    // Whether any indexing is in progress (initial or incremental).
    isIndexing: boolean;
    // Whether the search module is ready to receive any search queries.
    isSearchable: boolean;
    // Whether this tab is running an outdated app version compared to another tab.
    isRunningOutdatedVersion: boolean;
    // If non-null, a permanent error has stopped the processor.
    permanentError: PermanentErrorKind | null;
    // Per-populator status (progress, done, version) for UI and maintenance.
    indexPopulatorStatuses: IndexPopulatorStatus[];
};

export type AttributeFilter = string | bigint | boolean;

export enum IndexKind {
    // The main default index: My files.
    MAIN = 'main',

    // TODO: Add more indices as needed (e.g. Devices, Photos, Shared with me, ...)
}

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
