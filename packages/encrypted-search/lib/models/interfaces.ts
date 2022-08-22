import { EVENT_ACTIONS } from '@proton/shared/lib/constants';

import { ESSetResultsList } from './esFunctions';

/**
 * Object stored in local storage during indexing to keep track
 * of its status
 */
export interface ESProgressBlob {
    totalItems: number;
    numPauses: number;
    isRefreshed: boolean;
    timestamps: {
        type: 'start' | 'step' | 'stop';
        time: number;
    }[];
    currentItems?: number;
    originalEstimate: number;
}

/**
 * Object containing the ciphertext of items as stored in IDB
 */
export interface AesGcmCiphertext {
    iv: Uint8Array;
    ciphertext: ArrayBuffer;
}

/**
 * The base interface of all stored items in the ES DB. It must be extended
 * to define the interface of the product's specific stored item type. It
 * forces all stored items to have the aesGcmCiphertext field, which formats
 * an AES-GCM ciphertext correctly
 */
export interface ESStoredItem {
    aesGcmCiphertext: AesGcmCiphertext;
}

/**
 * Collection of fields to determine UI elements during indexing (e.g. progress bar, ...)
 */
export interface ESIndexingState {
    esProgress: number;
    estimatedMinutes: number;
    startTime: number;
    endTime: number;
    oldestTime: number;
    esPrevProgress: number;
    totalIndexingMessages: number;
    currentProgressValue: number;
}

/**
 * A decrypted copy of IDB kept in memory in plaintext form. The field
 * esCache is an array of all indexed items
 */
export interface ESCache<ESItem> {
    esCache: ESItem[];
    cacheSize: number;
    isCacheLimited: boolean;
    isCacheReady: boolean;
}

/**
 * Base type for metrics on encrypted search
 */
interface ESMetrics {
    indexSize: number;
    // Note: the metrics dashboard expects a variable called "numMessagesIndexed" but
    // it doesn't make too much sense in general to talk about "messages"
    numMessagesIndexed: number;
}

/**
 * Type of the metrics report sent after each search
 */
export interface ESSearchMetrics extends ESMetrics {
    cacheSize: number;
    isFirstSearch: boolean;
    isCacheLimited: boolean;
    searchTime: number;
}

/**
 * Type of the metrics report sent after indexing
 */
export interface ESIndexMetrics extends ESMetrics {
    numPauses: number;
    originalEstimate: number;
    numInterruptions: number;
    isRefreshed: boolean;
    indexTime: number;
}

/**
 * Required fields to correctly process events and keep IDB in sync. This object
 * instructs the code to apply Action to the item specified by ID. ItemEvent is
 * an optional field if more information are needed to sync the item
 */
export interface ESItemEvent<ESItemChanges> {
    ID: string;
    Action: EVENT_ACTIONS;
    ItemEvent: ESItemChanges | undefined;
}

/**
 * Overall structure of an event
 */
export interface ESEvent<ESItemChanges> {
    EventID?: string;
    Refresh?: number;
    Items?: ESItemEvent<ESItemChanges>[];
    attemptReDecryption?: boolean;
    eventToStore?: string;
}

/**
 * Internal variables on the status of ES
 */
export interface ESStatus<ESItem, ESSearchParameters> {
    permanentResults: ESItem[];
    setResultsList: ESSetResultsList<ESItem>;
    lastTimePoint: [number, number] | undefined;
    previousESSearchParams: ESSearchParameters | undefined;
    cachedIndexKey: CryptoKey | undefined;
    dbExists: boolean;
    isBuilding: boolean;
    isDBLimited: boolean;
    esEnabled: boolean;
    esSupported: boolean;
    isRefreshing: boolean;
    isSearchPartial: boolean;
    isSearching: boolean;
    isCaching: boolean;
    isFirstSearch: boolean;
}

/**
 * Subset of variables from the ES status useful to display correct UI
 * @var dbExists whether an instance of IndexedDB exists
 * @var isBuilding whether indexing is ongoing
 * @var isDBLimited whether IndexedDB has fewer than the total amount of items
 * @var esEnabled whether ES is enabled (in case a fallback to server-side search exists)
 * @var esSupported whether the browser supports our search engine. It's true by default until indexing fails to initialise IndexedDB
 * @var isRefreshing whether a refresh of IndexedDB (when correcting decryption errors) is ongoing
 * @var isSearchPartial whether the current search only has partial results. It happens when IndexedDB does not fit in cache
 * @var isSearching whether a search is ongoing
 * @var isCaching whether caching is ongoing
 */
export interface ESDBStatus<ESItem, ESSearchParameters>
    extends Pick<
            ESStatus<ESItem, ESSearchParameters>,
            | 'dbExists'
            | 'isBuilding'
            | 'isDBLimited'
            | 'esEnabled'
            | 'esSupported'
            | 'isRefreshing'
            | 'isSearchPartial'
            | 'isSearching'
            | 'isCaching'
        >,
        Pick<ESCache<ESItem>, 'isCacheLimited'> {}
