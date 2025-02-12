import { DAY } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import type { ESIndexingState, ESProgress, EncryptedSearchFunctions, OptionalESCallbacks } from './models';

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
 * other requests the app might send. Note that this should not be used for backgound
 * indexing, in which case ES_BACKGROUND_CONCURRENT should be used instead
 */
export const ES_MAX_CONCURRENT = 20;

/**
 * Number of items to fetch and process concurrently when the indexing is started in background mode
 */
export const ES_BACKGROUND_CONCURRENT = 1;

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
export const ES_MAX_METADATA_BATCH = 20;
export const ES_BACKGROUND_METADATA_BATCH = 1;

/**
 * Upper bound of number of items queried from IndexedDB at once
 */
export const ES_MAX_ITEMS_PER_BATCH = 1000;

/**
 * Current version of the most up-to-date ES IndexedDB
 */
export const INDEXEDDB_VERSION = 2;

/**
 * Maximum number of times an API call to fetch an item
 * content will be retried before being stored locally
 * for a later attempt
 */
export const ES_MAX_RETRIES = 10;

/**
 * Maximum delay between retries (24 hours in milliseconds)
 */
export const ES_MAX_RETRY_DELAY = DAY;

/**
 * Time after which to remove an item from retry queue (2 days in milliseconds)
 */
export const ES_RETRY_QUEUE_TIMEOUT = 2 * DAY;

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
 * Regular expression used to turn all fancy quotes into normal ones
 */
export const QUOTES_REGEXP =
    /\u00ab|\u00bb|\u201e|\u201c|\u201f|\u201d|\u275d|\u275e|\u276e|\u276f|\u2e42|\u301d|\u301e|\u301f|\uff02/gu;

/**
 * Regular expression used to turn all fancy apostrophes into normal ones
 */
export const APOSTROPHES_REGEXP = /\u2018|\u2019|\u02bc/gu;

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
    lastTimePoint: undefined,
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
    isContentIndexingPaused: false,
    isMetadataIndexingPaused: false,
    contentIndexingDone: false,
    isConfigFromESDBLoaded: false,
    getCacheStatus: () => ({ isCacheReady: false, isCacheLimited: false }),
};

export const defaultESCache = {
    esCache: new Map(),
    cacheSize: 0,
    isCacheLimited: false,
    isCacheReady: false,
};

export const defaultESIndexingState: ESIndexingState = {
    esProgress: 0,
    estimatedMinutes: 0,
    totalIndexingItems: 0,
    currentProgressValue: 0,
};

export const defaultESContext: EncryptedSearchFunctions<any, any, any> = {
    encryptedSearch: async () => false,
    highlightString: () => '',
    highlightMetadata: () => ({ numOccurrences: 0, resultJSX: null as any }),
    enableEncryptedSearch: async () => false,
    enableContentSearch: async () => {},
    handleEvent: async () => {},
    isSearchResult: () => false,
    esDelete: async () => {},
    shouldHighlight: () => false,
    initializeES: async () => {},
    pauseContentIndexing: async () => {},
    pauseMetadataIndexing: async () => {},
    cacheIndexedDB: async () => {},
    toggleEncryptedSearch: async () => {},
    getCache: () => new Map(),
    resetCache: () => {},
    correctDecryptionErrors: async () => 0,
    esStatus: defaultESStatus,
    progressRecorderRef: { current: [0, 0] },
    esIndexingProgressState: defaultESIndexingState,
};

export const defaultESCallbacks: OptionalESCallbacks<any, any, any> = {
    checkIsReverse: () => true,
    shouldOnlySortResults: () => false,
    resetSort: noop,
    getSearchInterval: () => ({ begin: undefined, end: undefined }),
    applyFilters: () => true,
    onContentDeletion: async () => {},
    correctDecryptionErrors: async () => 0,
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
