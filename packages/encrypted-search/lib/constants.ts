import { EncryptedSearchFunctions } from './models';

/**
 * Maximum number of times an API call to fetch an item
 * content will be retried before being stored locally
 * for a later attempt
 */
export const ES_MAX_RETRIES = 10;

/**
 * Number of items to add to the search results list during
 * a partial search. It corresponds to one page of results in mail
 */
export const ES_EXTRA_RESULTS_LIMIT = 50;

/**
 * Size of a batch of items during indexing and syncing.
 * It corresponds to the maximum number of messages' metadata returned
 * by mail API
 */
export const ES_MAX_PARALLEL_ITEMS = 150;

/**
 * Number of items to fetch and process concurrently during indexing
 */
export const ES_MAX_CONCURRENT = 10;

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
 * Number of items queried from IndexedDB when search is performed from disk in
 * chronological order
 */
export const ES_MAX_ITEMS_PER_BATCH = 1000;
export const ES_TEMPORARY_ERRORS = [408, 429, 502, 503];

/**
 * Regular expression used to find and/or remove diacritics for the purpose of
 * searching and highlighting text. It matches all combining characters
 */
export const DIACRITICS_REGEXP = /\p{Mark}/gu;

export const AesKeyGenParams: AesKeyGenParams = { name: 'AES-GCM', length: 128 };
export const KeyUsages: KeyUsage[] = ['encrypt', `decrypt`];

export const defaultESStatus = {
    permanentResults: [],
    setResultsList: () => {},
    lastTimePoint: undefined,
    previousESSearchParams: undefined,
    cachedIndexKey: undefined,
    dbExists: false,
    isBuilding: false,
    isDBLimited: false,
    esEnabled: false,
    esSupported: true,
    isRefreshing: false,
    isSearchPartial: false,
    isSearching: false,
    isCaching: false,
    isFirstSearch: true,
};

export const defaultESCache = {
    esCache: [],
    cacheSize: 0,
    isCacheLimited: true,
    isCacheReady: false,
};

export const defaultESContext: EncryptedSearchFunctions<any, any, any> = {
    encryptedSearch: async () => false,
    highlightString: () => '',
    highlightMetadata: () => ({ numOccurrences: 0, resultJSX: null as any }),
    resumeIndexing: async () => {},
    handleEvent: async () => {},
    isSearchResult: () => false,
    esDelete: async () => {},
    getESDBStatus: () => ({ ...defaultESStatus, isCacheLimited: defaultESCache.isCacheLimited }),
    getProgressRecorderRef: () => null as any,
    shouldHighlight: () => false,
    initializeES: async () => {},
    pauseIndexing: async () => {},
    cacheIndexedDB: async () => {},
    toggleEncryptedSearch: () => {},
};

export const defaultESIndexingState = {
    esProgress: 0,
    estimatedMinutes: 0,
    startTime: 0,
    endTime: 0,
    oldestTime: 0,
    esPrevProgress: 0,
    totalIndexingMessages: 0,
    currentProgressValue: 0,
};

export const defaultESHelpers = {
    preFilter: () => true,
    checkIsReverse: () => true,
    shouldOnlySortResults: () => false,
    getSearchInterval: () => ({ begin: undefined, end: undefined }),
    getDecryptionErrorParams: () => undefined,
    resetSort: () => {},
    indexNewUser: async () => false,
};
