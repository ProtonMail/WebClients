import { ESProgress, EncryptedSearchFunctions } from './models';

/**
 * Number of items to add to the search results list during
 * a partial search. It corresponds to one page of results in mail
 */
export const ES_EXTRA_RESULTS_LIMIT = 50;

/**
 * Size of a batch of items during indexing and syncing.
 * It corresponds to the maximum number of items' metadata returned
 * by mail API
 */
export const ES_MAX_PARALLEL_ITEMS = 150;

/**
 * Number of items to fetch and process concurrently during indexing. Some
 * browsers internally set the maximum concurrent requests to handle to 100,
 * therefore we impose a slightly more stringent limit to allow some room for
 * other requests the app might send
 */
export const ES_MAX_CONCURRENT = 90;

/**
 * Number of characters to retain from an item's metadata when highlighting it
 */
export const ES_MAX_INITIAL_CHARS = 20;

/**
 * Maximum size of cached items expressed in MB. It is heuristically determined
 * so to cover most users (it should be enough for ~50k emails, and more than 95% of
 * paid users have less than that, based on an extrapolation made in 2021) yet not
 * to be too heavy on their devices' memory. The target size is 500 MB, however the
 * number is larger due to our size estimation function being more conservative
 * than the actual memory occupation
 */
export const ES_MAX_CACHE = 600000000; // 600 MB

/**
 * Maximum number of metadata "pages" per batch during metadata indexing
 */
export const ES_MAX_METADATA_BATCH = 100;

/**
 * Upper bound of number of items queried from IndexedDB at once
 */
export const ES_MAX_ITEMS_PER_BATCH = 1000;

/**
 * Current version of the most up-to-date ES IndexedDB
 */
export const INDEXEDDB_VERSION = 2;

/**
 * Error codes that are deemed temporary and therefore will trigger a retry
 * during API calls that the ES library does
 */
export const ES_TEMPORARY_ERRORS = [408, 429, 502, 503];

/**
 * Regular expression used to find and/or remove diacritics for the purpose of
 * searching and highlighting text. It matches all combining characters
 */
export const DIACRITICS_REGEXP = /\p{Mark}/gu;

/**
 * Configuration of the Web Crypto API to symmetrically encrypt items in IndexedDB
 */
export const AesKeyGenParams: AesKeyGenParams = { name: 'AES-GCM', length: 128 };
export const KeyUsages: KeyUsage[] = ['encrypt', `decrypt`];

/**
 * ENUMS
 */
export enum INDEXING_STATUS {
    INACTIVE,
    INDEXING,
    PAUSED,
    ACTIVE,
}

export enum TIMESTAMP_TYPE {
    STOP,
    START,
    STEP,
}

export enum ES_SYNC_ACTIONS {
    DELETE,
    CREATE,
    UPDATE_CONTENT,
    UPDATE_METADATA,
}

export enum STORING_OUTCOME {
    FAILURE,
    SUCCESS,
    QUOTA,
}

/**
 * DEFAULTS
 */
export const defaultESStatus = {
    permanentResults: [],
    setResultsList: () => {},
    contentIDs: new Set<string>(),
    previousESSearchParams: undefined,
    cachedIndexKey: undefined,
    dbExists: false,
    isEnablingContentSearch: false,
    isDBLimited: false,
    esEnabled: false,
    esSupported: true,
    isRefreshing: false,
    isSearchPartial: false,
    isSearching: false,
    isFirstSearch: true,
    isEnablingEncryptedSearch: false,
    isPaused: false,
    contentIndexingDone: false,
};

export const defaultESCache = {
    esCache: new Map(),
    cacheSize: 0,
    isCacheLimited: false,
    isCacheReady: false,
    isContentCached: false,
};

export const defaultESContext: EncryptedSearchFunctions<any, any, any> = {
    encryptedSearch: async () => false,
    highlightString: () => '',
    highlightMetadata: () => ({ numOccurrences: 0, resultJSX: null as any }),
    enableEncryptedSearch: async () => {},
    enableContentSearch: async () => {},
    handleEvent: async () => {},
    isSearchResult: () => false,
    esDelete: async () => {},
    getESDBStatus: () => ({ ...defaultESStatus, isCacheLimited: defaultESCache.isCacheLimited }),
    getProgressRecorderRef: () => ({ current: [0, 0] }),
    shouldHighlight: () => false,
    initializeES: async () => {},
    pauseIndexing: async () => {},
    cacheIndexedDB: async () => ({ current: defaultESCache }),
    cacheMetadataOnly: async () => ({ current: defaultESCache }),
    getESCache: () => ({ current: defaultESCache }),
    toggleEncryptedSearch: async () => {},
    resetCache: () => {},
};

export const defaultESIndexingState = {
    esProgress: 0,
    estimatedMinutes: 0,
    startTime: 0,
    endTime: 0,
    oldestTime: 0,
    esPrevProgress: 0,
    totalIndexingItems: 0,
    currentProgressValue: 0,
};

export const defaultESHelpers = {
    checkIsReverse: () => true,
    shouldOnlySortResults: () => false,
    resetSort: () => {},
    searchContent: () => false,
};

export const defaultESProgress: ESProgress = {
    totalItems: 0,
    numPauses: 0,
    isRefreshed: false,
    timestamps: [],
    originalEstimate: 0,
    recoveryPoint: undefined,
    status: INDEXING_STATUS.INACTIVE,
};
