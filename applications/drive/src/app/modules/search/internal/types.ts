export type UserId = string & { readonly __brand: 'SearchUserId' };
export type ClientId = string & { readonly __brand: 'SearchClientId' };

export type SearchModuleState = {
    // Whether search indexes are being built initially.
    isInitialIndexing: boolean;
    // Whether the search module is ready to receive any search queries.
    isSearchable: boolean;
};

export type SearchQuery = {
    filename: string;
};

/**
 * Identifies which Proton Drive SDK client an engine is backed by.
 * Determines how the main thread resolves nodes returned by search results.
 */
export enum SdkType {
    DRIVE = 'DRIVE',
    PHOTOS = 'PHOTOS',
}

/**
 * Unique identifier for each search engine managed by the orchestrator.
 * Each label maps to a distinct index targeting a specific data domain
 * (e.g. user's files, shared items, photos).
 */
export enum EngineType {
    MY_FILES = 'MY_FILES',
}

export type SearchResultItem = {
    nodeUid: string;
    score: number;
    engineType: EngineType;
    sdkType: SdkType;
};

/**
 * Discriminated union for streaming search results across the Comlink boundary from the shared worker to the main thread.
 */
export type WorkerSearchResultEvent = ({ type: 'item' } & SearchResultItem) | { type: 'done' };
