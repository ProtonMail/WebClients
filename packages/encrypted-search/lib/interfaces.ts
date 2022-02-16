import { Location, History } from 'history';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { DecryptedKey } from '@proton/shared/lib/interfaces';

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
export interface ESMetrics {
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
 * Collection of helpers for indexing that should be defined based on the specific IDB schema and ES items
 */
export interface ESIndexingHelpers<ESItemMetadata, ESItem, ESCiphertext> {
    /**
     * Return the ID according to which an item is stored, either from its plaintext
     * form, from its form stored in IDB or from its metadata
     * @param storedItem The item object or its form stored in IDB or metadata
     * @returns Its ID, i.e. the primary key under which it is indexed in the main object store
     */
    getItemID: (item: ESCiphertext | ESItem | ESItemMetadata) => string;

    /**
     * Send the API request to fetch the item and return it decrypted. If anything fails and itemMetadata
     * is given, return an item made only with the metadata. Otherwise return undefined
     * @param itemID The unique ID used as a primary key in IDB
     * @param itemMetadata The metadata of an item
     * @param abortSignal An AbortSignal object to abort the request
     * @returns A decrypted item, potentially without content, or undefined if something fails and itemMetadata is not provided
     */
    fetchESItem: (
        itemID: string,
        itemMetadata?: ESItemMetadata,
        abortSignal?: AbortSignal
    ) => Promise<ESItem | undefined>;

    /**
     * Return the value to be stored to IDB given the plaintext item and its encryption.
     * This can be used to specify also some fields to be left unencrypted in IDB
     * @param itemToStore An item object, used to extract fields that need to be stored in plaintext, if any
     * @param aesGcmCiphertext The object containing the AES-GCM ciphertext of the item, should be returned as is as part of the ESCiphertext
     * @returns An object that is to be stored to IDB. It must contain aesGcmCiphertext as a field
     */
    prepareCiphertext: (itemToStore: ESItem, aesGcmCiphertext: AesGcmCiphertext) => ESCiphertext;

    /**
     * Retrieve a batch of items' metadata, based on the last stored item
     * @param lastStoredItem The last item present in index
     * @param signal An AbortSignal object to abort the request
     * @returns An array of metadata items, i.e. the next batch of items that need to be indexed
     */
    queryItemsMetadata: (
        lastStoredItem: ESCiphertext | undefined,
        signal: AbortSignal
    ) => Promise<ESItemMetadata[] | undefined>;

    /**
     * Fetch the last event ID before starting building IDB, to mark the point in time
     * where a catch-up must start
     * @returns The event ID of the last event that happened before indexing
     */
    getPreviousEventID: () => Promise<string>;
}

/**
 * Collection of helpers for searching and caching that should be defined based on the specific IDB schema and ES items
 */
export interface ESSearchingHelpers<ESItem, ESCiphertext, ESSearchParameters> {
    /**
     * Decide whether to decrypt an item fetched from IDB. Therefore this can only
     * be based upon unencrypted fields of the stored items, e.g. a subset of the metadata.
     * This callback is optional: if not provided, no pre-filtering will be applied and all items
     * will be searched.
     * @param storedCiphertext The object stored in IDB as is, which might be comprised of plaintext fields
     * @param esSearchParams Search parameters to apply any user selected filter on storedCiphertext
     * @returns Whether to continue search the content of storedCiphertext or to discard it
     */
    preFilter?: (storedCiphertext: ESCiphertext, esSearchParams: ESSearchParameters) => boolean;

    /**
     * Decide whether the decrypted item should be returned as a search result
     * @param esSearchParams Search parameters to apply any user selected keywords on itemToSearch
     * @param itemToSearch The item on which to apply the search
     * @returns Whether itemToSearch is a search result or not
     */
    applySearch: (esSearchParams: ESSearchParameters, itemToSearch: ESItem) => boolean;

    /**
     * Return true if the search is in reverse chronological order
     * This callback is optional: if not provided, search is always considered in reverse chronological order
     * @param esSearchParams The search parameters, in which the information about the order of the search is stored
     * @returns Whether the search is in reverse chronological order or not
     */
    checkIsReverse?: (esSearchParams: ESSearchParameters) => boolean;

    /**
     * Check whether the only thing that changed between two consecutive (and "adjacent", in the
     * sense that they are performed one after the other) searches is the ordering and if the
     * search is "complete", i.e. not with partial results
     * This callback is optional: if not provided, search is always performed even if only the sorting changes
     * @param esSearchParams1 The search parameters of the first search
     * @param esSearchParams2 The search parameters of the second search
     * @returns Whether the search filters (e.g. keywords, folder, ...) are the same, such that only a change
     * of ordering is needed
     */
    shouldOnlySortResults?: (esSearchParams1: ESSearchParameters, esSearchParams2: ESSearchParameters) => boolean;

    /**
     * Extract the time of an item or from its encrypted version. What is extracted is the key according
     * to which items are stored in the temporal index of the main object store
     * @param item Either an item or the object stored in IDB (containing the item's encryption)
     * @returns The time associated to the item
     */
    getTimePoint: (item: ESItem | ESCiphertext) => [number, number];

    /**
     * Estimate the size of a plaintext item
     * @param esItem The item of which the size needs to be estimated
     * @returns The estimated size in bytes
     */
    sizeOfESItem: (esItem: ESItem) => number;

    /**
     * Return the time interval inside the search parameters when specified by
     * the user as a search filter.
     * This callback is optional: if not provided, the time interval is always undefined as if the user
     * never selected one
     * @param esSearchParameters The product's specific search parameters
     * @returns The begin and end of the time interval selected by the user
     */
    getSearchInterval?: (esSearchParameters?: ESSearchParameters) => {
        begin: number | undefined;
        end: number | undefined;
    };
}

/**
 * Collection of helpers for syncing that should be defined based on the specific IDB schema and ES items
 */
export interface ESSyncingHelpers<ESItemMetadata, ESItem, ESItemChanges, ESCiphertext, ESSearchParameters>
    extends ESIndexingHelpers<ESItemMetadata, ESItem, ESCiphertext>,
        ESSearchingHelpers<ESItem, ESCiphertext, ESSearchParameters> {
    /**
     * Return the total number of items (e.g. mails in mail, files in drive, ...)
     * @returns The total number of items
     */
    getTotalItems: () => Promise<number>;

    /**
     * Update an existing item, e.g. because of an event to sync
     * @param esItemMetadata The set of changes that needs to be applied to an item
     * @param oldItem The item to modify
     * @returns The updated item
     */
    updateESItem: (esItemMetadata: ESItemChanges, oldItem: ESItem) => ESItem;

    /**
     * Generate an instance of ESSearchParams that specifies to fetch all items
     * that failed decryption during indexing. The return value of this function
     * is used to fetch from IDB all messages that failed decryption during indexing
     * in order to retry indexing them, whenever an old key is reactivated after a
     * password recovery
     * This callback is optional: if not provided, decryption errors are never corrected
     * @returns An instance of ESSearchParams that allows retrieving from IDB all items
     * that failed decryption during indexing
     */
    getDecryptionErrorParams?: () => ESSearchParameters | undefined;

    /**
     * Read the last event according to which IDB was sycned from local storage and
     * return all new events that need to be synced, whether a refresh is needed and
     * the event ID(s) to catch up the next time
     * @returns @param newEvents An array of events that need to be synced
     * @returns @param shouldRefresh Whether a hard reset of IDB is needed, i.e. erasing it and re-index
     * @returns @param eventToStore The event ID of the last event to be stored in local storage
     * for then next catch-up
     */
    getEventFromLS: () => Promise<{
        newEvents: ESEvent<ESItemChanges>[];
        shouldRefresh: boolean;
        eventToStore: string | undefined;
    }>;
}

/**
 * Interface for all the helpers
 */
export interface ESHelpers<ESItemMetadata, ESItem, ESSearchParameters, ESItemChanges, ESCiphertext>
    extends ESIndexingHelpers<ESItemMetadata, ESItem, ESCiphertext>,
        ESSearchingHelpers<ESItem, ESCiphertext, ESSearchParameters>,
        ESSyncingHelpers<ESItemMetadata, ESItem, ESItemChanges, ESCiphertext, ESSearchParameters> {
    /**
     * Extract search parameters, current page (if applicable) and whether it's a search from URL
     * @param location The history location object
     * @returns @param isSearch Whether the URL is in "search mode"
     * @returns @param esSearchParams The search parameters extracted from the URL
     */
    parseSearchParams: (location: Location) => {
        isSearch: boolean;
        esSearchParams: ESSearchParameters;
    };

    /**
     * Resert the sorting to inverse chronological order, since ES does not support other orders
     * This callback is optional: if not provided, sorting is never reset
     * @param The history object to reset the URL to remove any sorting filters
     */
    resetSort?: (history: History) => void;

    /**
     * New users, i.e. those logging in for the first time (to whom the welcome flow is shown) have
     * very few items, therefore it is convenient to already build the index
     * This callback is optional: if not provided, indexing never starts automatically for new users
     * @returns Whether to start indexing automatically for the current user because they're new
     */
    indexNewUser?: () => Promise<boolean>;

    /**
     * Extract keywords from the search parameters
     * @param esSearchParams The current search parameter
     * @returns An array of all the search keywords, or undefined if none were selected
     */
    getKeywords: (esSearchParams: ESSearchParameters) => string[] | undefined;
}

/**
 * Show or update the search results in the UI
 */
export type ESSetResultsList<ESItem> = (Elements: ESItem[]) => void;

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

/**
 * Type of functions
 */
export type GetUserKeys = () => Promise<DecryptedKey[]>;
export type EncryptedSearch<ESItem> = (setResultsList: ESSetResultsList<ESItem>) => Promise<boolean>;
export type HighlightString = (content: string, setAutoScroll: boolean) => string;
export type HighlightMetadata = (
    metadata: string,
    isBold?: boolean,
    trim?: boolean
) => { numOccurrences: number; resultJSX: JSX.Element };
export type ResumeIndexing = (options?: { notify?: boolean; isRefreshed?: boolean }) => Promise<void>;

/**
 * Core functionalities of ES to be used in the product
 */
export interface EncryptedSearchFunctions<ESItem, ESSearchParameters, ESItemChanges> {
    /**
     * Run a new encrypted search or increment an existing one (the difference is handled internally).
     * @param setResultsList a callback that will be given the items to show, i.e. those found as search
     * results, and that should handle the UI part of displaying them to the users
     * @returns a boolean indicating the success of the search
     */
    encryptedSearch: EncryptedSearch<ESItem>;

    /**
     * Insert the <mark></mark> highlighting markdown in a string and returns a string containing it,
     * which then needs to be displayed in the UI. Note that the keywords to highlight are extracted
     * directly with the parseSearchParams callback
     * @param content the string where to insert the markdown
     * @param setAutoScroll whether to insert the data-auto-scroll attribute to the first istance of
     * the inserted mark tags. The UI should automatically scroll, if possible, to said first tag
     * @returns the string containing the markdown
     */
    highlightString: HighlightString;

    /**
     * Inserts the <mark></mark> highlighting markdown in a string and returns directly the JSX node
     * to be used in React
     * @param metadata the string where to insert the markdown
     * @param isBold specifies whether the text should also be bolded (e.g. in some headers)
     * @param trim specifies whether to substitute the initial portion of the string by an ellipsis
     * if it's too long
     * @returns an object containing two properties: numOccurrences is the total number of times the
     * markdown tag has been added to the given string, while resultJSX is the actual React node to be
     * displayed
     */
    highlightMetadata: HighlightMetadata;

    /**
     * Start indexing for the first time or resume it after the user paused it. It optionally accepts
     * an object with two properties.
     * @param notify specifies whether any pop-up banner will be displayed to the user indicating success
     * or failure of the indexing process
     * @param isRefreshed is only used to be forward to the metrics route for statistical purposes.
     * Whenever the user manually starts indexing, the latter shouldn't be specified (and defaults to false).
     */
    resumeIndexing: ResumeIndexing;

    /**
     * Process events (according to the provided callbacks). It should be used in whatever event handling
     * system the product uses to correctly sync the ES database.
     * @param event a single event containing a change to the items stored in the ES database
     */
    handleEvent: (event: ESEvent<ESItemChanges>) => Promise<void>;

    /**
     * @returns whether a given item, specified by its ID, is part of the currently shown search results or not.
     * It returns false if a search is not happening on going
     */
    isSearchResult: (ID: string) => boolean;

    /**
     * Wipe all local data related to ES, both from IndexedDB and local storage
     */
    esDelete: () => Promise<void>;

    /**
     * @returns an object containing boolean variables descrbing the status of the library,
     * which is useful to determine specific UI in certain occasions. See the description of
     * the ESDBStatus interface for more details on the specific variables
     */
    getESDBStatus: () => ESDBStatus<ESItem, ESSearchParameters>;

    /**
     * @returns a reference object to two values related to an IndexedDB operation status.
     * The first number in the returned list is the current number of items processed while
     * the second is the total number of items to process. It is useful to show a progress bar.
     */
    getProgressRecorderRef: () => React.MutableRefObject<[number, number]>;

    /**
     * @returns whether some conditions to apply highlighting are met, i.e. whether a search is
     * on and there are keywords. For example in cases where the user only specifies filters
     * and not keywords, this function returns false
     */
    shouldHighlight: () => boolean;

    /**
     * Run some initial checks on the status of ES. This must be the first function that
     * the EncryptedSearchProvider runs, as it checks for new events, continues indexing in
     * case a previous one was started, checks whether the index key is still accessible
     */
    initializeES: () => Promise<void>;

    /**
     * Pause the currently ongoing indexing process, if any
     */
    pauseIndexing: () => Promise<void>;

    /**
     * Start the caching routine, i.e. fetching and decrypting as many items from the ES
     * database as possible to be stored in memory for quick access
     */
    cacheIndexedDB: () => Promise<void>;

    /**
     * Deactivates ES. This does not remove anything, and the database keeps being synced.
     * It is used to switch ES temporarily off in cases when server side search is available.
     */
    toggleEncryptedSearch: () => void;
}
