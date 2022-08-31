import { DBSchema } from 'idb';

import { ES_SYNC_ACTIONS, INDEXING_STATUS, TIMESTAMP_TYPE } from '../constants';
import { ESSetResultsList } from './esFunctions';

/**
 * Object stored in local storage during indexing to keep track
 * of its status. Note that recoveryPoint can differ between
 * metadata or content indexing. In particular, the former can
 * have any recovery point based on the product's needs, while
 * the latter must have  [number, number] recovery point, since
 * that's the key of the temporalIndex. For simplicity, such a
 * typing is not enforced here but when reading and writing
 * recoveryPoint from/to IDB
 */
export interface ESProgress {
    totalItems: number;
    numPauses: number;
    isRefreshed: boolean;
    timestamps: {
        type: TIMESTAMP_TYPE;
        time: number;
    }[];
    originalEstimate: number;
    recoveryPoint: any;
    status: INDEXING_STATUS;
}

/**
 * Collection of progress objects defined by the ESProgress interface
 * "metadata" is always present, being it the default content type enabled by encrypted search
 */
export interface ProgressObject {
    metadata: ESProgress;
    content?: ESProgress;
}

/**
 * Collection of event IDs for all the components specified by the
 * product (e.g. calendars in calendar and shares in drive)
 */
export interface EventsObject {
    [components: string]: string;
}

/**
 * Object containing the ciphertext of items as stored in IDB
 */
export interface AesGcmCiphertext {
    iv: Uint8Array;
    ciphertext: ArrayBuffer;
}

/**
 * Ciphertexts in IDB have out-of-line keys, therefore we need
 * to specify the ID with which to index items externally
 */
export type CiphertextToStore = {
    itemID: string;
    aesGcmCiphertext: AesGcmCiphertext;
};

/**
 * List of possible key-value pairs types in the config object store
 */
export interface ConfigValues {
    indexKey: string;
    size: number;
    enabled: boolean;
    limited: boolean;
    migrated?: any;
}
export type ConfigKeys = keyof ConfigValues;

/**
 * IndexedDB structure. Each sub-object corresponds to an object store
 *   - config contains overall information, e.g. whether ES was enabled
 *     or disabled, the index key and the estimated size of all items
 *   - events contains the latest event IDs according to which items
 *     had been updated, for all components of the product
 *   - indexingProgress contains information about the status of indexing
 *     for metadata and for any other content type specified by the product
 *   - metadata contains all the actual items' metadata
 *   - content contains the content of the items which are stored in the
 *     metadata objectStore
 */
export interface EncryptedSearchDB extends DBSchema {
    config: {
        value: ConfigValues[ConfigKeys];
        key: ConfigKeys;
    };
    events: {
        value: string;
        key: string;
    };
    indexingProgress: {
        value: ESProgress;
        key: string;
    };
    metadata: {
        value: AesGcmCiphertext;
        key: string;
    };
    content: {
        value: AesGcmCiphertext;
        key: string;
    };
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
    totalIndexingItems: number;
    currentProgressValue: number;
}

/**
 * Object representing the primary ID and the temporal coordinate
 * of an item
 */
export interface ESItemInfo {
    ID: string;
    timepoint: [number, number];
}

export interface CachedItem<ESItemMetadata, ESItemContent> {
    metadata: ESItemMetadata;
    content?: ESItemContent;
}

/**
 * A decrypted copy of IDB kept in memory in plaintext form. The property
 * esCache is a map of all indexed items. The property isCacheLimited refers
 * to content only, as metadata is assumed to always fit cache
 */
export interface ESCache<ESItemMetadata, ESItemContent> {
    esCache: Map<string, CachedItem<ESItemMetadata, ESItemContent>>;
    cacheSize: number;
    isCacheLimited: boolean;
    isCacheReady: boolean;
    isContentCached: boolean;
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
 * instructs the code to apply Action to the item specified by ID. ItemMetadata
 * contains the metadata of the item being changed and can be omitted only in
 * deletion events
 */
export interface ESItemEvent<ESItemMetadata> {
    ID: string;
    Action: ES_SYNC_ACTIONS;
    ItemMetadata: ESItemMetadata | undefined;
}

/**
 * Overall structure of an event
 */
export interface ESEvent<ESItemMetadata> {
    EventID: string;
    Refresh?: number;
    Items?: ESItemEvent<ESItemMetadata>[];
    attemptReDecryption?: boolean;
    eventsToStore: EventsObject;
}

/**
 * Interface representing an ESItem, i.e. the combination of metadata plus
 * content. This is the overall item that can be searched. Note that metadata
 * must always be present, while content is optional, either because content
 * search hasn't been activated, or because a product doesn't support content
 * altogether
 */
export type ESItem<ESItemMetadata, ESItemContent> = ESItemMetadata & Partial<ESItemContent>;

/**
 * Internal variables on the status of ES
 */
export interface ESStatus<ESItemMetadata, ESItemContent, ESSearchParameters> {
    permanentResults: ESItem<ESItemMetadata, ESItemContent>[];
    setResultsList: ESSetResultsList<ESItemMetadata, ESItemContent>;
    contentIDs: Set<string>;
    previousESSearchParams: ESSearchParameters | undefined;
    cachedIndexKey: CryptoKey | undefined;
    dbExists: boolean;
    isDBLimited: boolean;
    esEnabled: boolean;
    esSupported: boolean;
    isRefreshing: boolean;
    isSearchPartial: boolean;
    isSearching: boolean;
    isFirstSearch: boolean;
    isEnablingContentSearch: boolean;
    isEnablingEncryptedSearch: boolean;
    isPaused: boolean;
    contentIndexingDone: boolean;
}

/**
 * Subset of variables from the ES status useful to display correct UI
 * @var dbExists whether an instance of IndexedDB exists
 * @var isEnablingContentSearch whether indexing of content is ongoing
 * @var isDBLimited whether IndexedDB has fewer than the total amount of items
 * @var esEnabled whether ES is enabled (in case a fallback to server-side search exists)
 * @var esSupported whether the browser supports our search engine. It's true by default until indexing fails to initialise IndexedDB
 * @var isRefreshing whether a refresh of IndexedDB (when correcting decryption errors) is ongoing
 * @var isSearchPartial whether the current search only has partial results. It happens when IndexedDB does not fit in cache
 * @var isSearching whether a search is ongoing
 * @var isCacheLimited whether the cache is limited, i.e. it doesn't contain all items that are in IndexedDB
 * @var isEnablingEncryptedSearch whether indexing of metadata is ongoing
 * @var isPaused whether content indexing is paused
 * @var contentIndexingDone whether content indexing is finished
 */
export interface ESDBStatus<ESItemMetadata, ESItemContent, ESSearchParameters>
    extends Pick<
            ESStatus<ESItemMetadata, ESItemContent, ESSearchParameters>,
            | 'dbExists'
            | 'isEnablingContentSearch'
            | 'isDBLimited'
            | 'esEnabled'
            | 'esSupported'
            | 'isRefreshing'
            | 'isSearchPartial'
            | 'isSearching'
            | 'isEnablingEncryptedSearch'
            | 'isPaused'
            | 'contentIndexingDone'
        >,
        Pick<ESCache<unknown, unknown>, 'isCacheLimited'> {}
