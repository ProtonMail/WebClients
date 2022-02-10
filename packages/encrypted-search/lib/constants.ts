export const OPENPGP_REFRESH_CUTOFF = 10;
export const ES_EXTRA_RESULTS_LIMIT = 50;
export const ES_MAX_PARALLEL_ITEMS = 150;
export const ES_MAX_CONCURRENT = 10;
export const ES_MAX_INITIAL_CHARS = 20;
export const ES_MAX_CACHE = 500000000; // 500 MB
export const ES_MAX_ITEMS_PER_BATCH = 1000;

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
