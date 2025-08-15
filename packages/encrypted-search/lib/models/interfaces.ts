import type { DBSchema } from 'idb';

import type { ES_SYNC_ACTIONS, INDEXING_STATUS, TIMESTAMP_TYPE } from '../constants';
import type { ESSetResultsList } from './esFunctions';

/**
 * Object to be stored locally to retry an API call
 */
export interface RetryObject {
    retryTime: number;
    numberRetries: number;
}

/**
 * Object stored in local storage during indexing to keep track
 * of its status. Note that recoveryPoint can differ between
 * metadata or content indexing
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
    iv: Uint8Array<ArrayBuffer>;
    ciphertext: ArrayBuffer;
}

/**
 * The type of keys in the temporal index of ESDB. The first number
 * is supposed to be a time coordinate, while the second one a
 * tie-breaker in case of equal time
 */
export type ESTimepoint = [number, number];

/**
 * Object representing the primary ID and the temporal coordinate
 * of an item
 */
export interface ESItemInfo {
    ID: string;
    timepoint: ESTimepoint;
}

/**
 * Encrypted item, that can be either metadata or content, with
 * extra information in plaintext
 */
export interface EncryptedItemWithInfo extends ESItemInfo {
    keepSize?: boolean;
    aesGcmCiphertext: AesGcmCiphertext;
}

/**
 * Encrypted item, that can be either metadata or content, with
 * its ID in plaintext
 */
export type EncryptedItemWithID = Omit<EncryptedItemWithInfo, 'timepoint' | 'keepSize'>;

/**
 * Ciphertexts in the metadata table of IDB have out-of-line keys,
 * therefore we need to specify the ID with which to index items externally
 */
export type EncryptedMetadataItem = Omit<EncryptedItemWithInfo, 'ID'>;

/**
 * List of possible key-value pairs types in the config object store
 */
export interface ConfigValues {
    indexKey: string;
    size: number;
    enabled: boolean;
    limited: boolean;
    retries?: string;
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
        value: EncryptedMetadataItem;
        key: string;
        indexes: { temporal: 'timepoint' };
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
    /**
     * number of items indexed so far
     */
    esProgress: number;
    /**
     * estimated time (in minutes) expected for indexing to finish
     */
    estimatedMinutes: number;
    /**
     * Total items to index
     */
    totalIndexingItems: number;
    /**
     * progress value in percentage, i.e. number from 0 to 100
     */
    currentProgressValue: number;
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
 * Boolean variables of the ES status useful to display correct UI
 * @var dbExists whether an instance of IndexedDB exists
 * @var isEnablingContentSearch whether indexing of content is ongoing
 * @var isDBLimited whether IndexedDB has fewer than the total amount of items
 * @var esEnabled whether ES is enabled (in case a fallback to server-side search exists)
 * @var esSupported whether the browser supports our search engine. It's true by default until indexing fails to initialise IndexedDB
 * @var isRefreshing whether a refresh of IndexedDB (when correcting decryption errors) is ongoing
 * @var isSearchPartial whether the current search only has partial results. It happens when IndexedDB does not fit in cache
 * @var isSearching whether a search is ongoing
 * @var isCacheLimited whether the cache is limited, i.e. it doesn't contain all items that are in IndexedDB
 * @var isCacheReady whether in-memory cache load is filled
 * @var isEnablingEncryptedSearch whether indexing of metadata is ongoing
 * @var isContentIndexingPaused whether content indexing is paused
 * @var isMetadataIndexingPaused whether metadata indexing is paused
 * @var contentIndexingDone whether content indexing is finished
 */
export interface ESStatusBooleans {
    dbExists: boolean;
    isDBLimited: boolean;
    esEnabled: boolean;
    esSupported: boolean;
    isRefreshing: boolean;
    isSearchPartial: boolean;
    isSearching: boolean;
    isFirstSearch: boolean;
    isEnablingContentSearch: boolean;
    isContentIndexingPaused: boolean;
    isMetadataIndexingPaused: boolean;
    isEnablingEncryptedSearch: boolean;
    contentIndexingDone: boolean;
    isConfigFromESDBLoaded: boolean;
}

/**
 * Internal variables on the status of ES
 */
export interface ESStatus<ESItemMetadata, ESItemContent, ESSearchParameters> extends ESStatusBooleans {
    permanentResults: ESItem<ESItemMetadata, ESItemContent>[];
    setResultsList: ESSetResultsList<ESItemMetadata, ESItemContent>;
    lastTimePoint: ESTimepoint | undefined;
    previousESSearchParams: ESSearchParameters | undefined;
    cachedIndexKey: CryptoKey | undefined;
    getCacheStatus: () => { isCacheReady: boolean; isCacheLimited: boolean };
}
