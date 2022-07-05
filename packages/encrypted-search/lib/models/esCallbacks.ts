import { AesGcmCiphertext, ESEvent } from './interfaces';

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
     * Get whether there is a search happening and its search parameters
     * @returns @param isSearch Whether the app is on a search page
     * @returns @param esSearchParams The search parameters
     */
    getSearchParams: () => {
        isSearch: boolean;
        esSearchParams: ESSearchParameters | undefined;
    };

    /**
     * Resert the sorting to inverse chronological order, since ES does not support other orders
     * This callback is optional: if not provided, sorting is never reset
     */
    resetSort?: () => void;

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
