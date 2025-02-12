import type { GetItemInfo } from './esFunctions';
import type { RecordProgress } from './esIndexing';
import type { CachedItem, ESEvent, ESStatusBooleans, EventsObject } from './interfaces';

/**
 * Interface for all the callbacks that are required to run the basic
 * functionalities of the ES library. All products must pass these
 * callbacks in order to use the library
 */
interface RequiredESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent> {
    /**
     * Retrieve a batch of items' metadata, the mechanism to keep track of where the fetching
     * has arrived is supposed to be built-in (but can optionally take a boolean indicating whether
     * to store progress in IDB or only in memory. It defaults to true, i.e. store in IDB too.)
     * @param signal an abort signal to abort potential API calls in case of sudden aborts
     * @param isBackgroundIndexing whether the current indexing was triggered in the background, i.e.
     * without explicit user prompt. This is optional but might be useful, e.g., in case throttling is needed
     * @returns An array of metadata items, i.e. the next batch of items that need to be indexed,
     * as well as a callback to set the recovery point in IndexedDB for the next call to queryItemsMetadata
     * to start from. This ensures that the recovery point is stored only when and if all associated items
     * are actually indexed. Note that this is optional and if not returned, no recovery point is set
     */
    queryItemsMetadata: (
        signal: AbortSignal,
        isBackgroundIndexing?: boolean
    ) => Promise<{
        resultMetadata?: ESItemMetadata[];
        setRecoveryPoint?: (setIDB?: boolean) => Promise<void>;
    }>;

    /**
     * Fetch the last event ID before starting building IDB to mark the point in time
     * where a catch-up must start, for every component affecting the specific product
     * @returns The event ID of the last event that happened before indexing
     */
    getPreviousEventID: () => Promise<EventsObject>;

    /**
     * Extract the ID and timepoint of an item or from its encrypted version. The timepoint is the key according
     * to which items are stored in the temporal index of the main object store, while the ID is the primary
     * key of the object store itself
     * @param item Either an item or the object stored in IDB (containing the item's encryption)
     * @returns The time associated to the item
     */
    getItemInfo: GetItemInfo<ESItemMetadata>;

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
     * Extract keywords from the search parameters
     * @param esSearchParams The current search parameter
     * @returns An array of all the search keywords, or undefined if none were selected
     */
    getKeywords: (esSearchParams: ESSearchParameters) => string[] | undefined;

    /**
     * Decide whether the decrypted content should be returned as a search result
     * @param keywords User specified keywords
     * @param itemToSearch The item on which to apply the search
     * @param hasApostrophe Whether apostrophes need to be normalized
     * @returns Whether itemToSearch is a search result or not
     */
    searchKeywords: (
        keywords: string[],
        itemToSearch: CachedItem<ESItemMetadata, ESItemContent>,
        hasApostrophe: boolean
    ) => boolean;

    /**
     * Return the total number of items (e.g. mails in mail, files in drive, ...)
     * @returns The total number of items
     */
    getTotalItems: () => Promise<number>;

    /**
     * Read the last event according to which IDB was sycned from local storage and
     * return all new events that need to be synced, whether a refresh is needed and
     * the event ID(s) to catch up the next time. In case, instead, the event object is
     * given to the function, return all events since the given event object
     * @returns @param newEvents An array of events that need to be synced
     * @returns @param shouldRefresh Whether a hard reset of IDB is needed, i.e. erasing it and re-index
     * @returns @param eventsToStore The EventsObject containing all of the last events to be stored in
     * local storage for the next catch-up
     */
    getEventFromIDB: (previousEventsObject?: EventsObject) => Promise<{
        newEvents: ESEvent<ESItemMetadata>[];
        shouldRefresh: boolean;
        eventsToStore: EventsObject;
    }>;
}

/**
 * Interface for all the callbacks that are optional and give access to
 * functionalities which are not essential for the correct functioning of the ES library.
 * Each callback description details what happens if the callback is not specified
 */
export interface OptionalESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent> {
    /**
     * Resert the sorting to inverse chronological order, since ES does not support other orders
     * This callback is optional: if not provided, sorting is never reset
     */
    resetSort: () => void;

    /**
     * Return true if the search is in reverse chronological order
     * This callback is optional: if not provided, search is always considered in reverse chronological order
     * @param esSearchParams The search parameters, in which the information about the order of the search is stored
     * @returns Whether the search is in reverse chronological order or not
     */
    checkIsReverse: (esSearchParams: ESSearchParameters) => boolean;

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
    shouldOnlySortResults: (esSearchParams1: ESSearchParameters, esSearchParams2: ESSearchParameters) => boolean;

    /**
     * Return the time interval inside the search parameters when specified by
     * the user as a search filter.
     * This callback is optional: if not provided, the time interval is always undefined as if the user
     * never selected one
     * @param esSearchParameters The product's specific search parameters
     * @returns The begin and end of the time interval selected by the user
     */
    getSearchInterval: (esSearchParameters: ESSearchParameters) => {
        begin: number | undefined;
        end: number | undefined;
    };

    /**
     * Test whether any filter applies to a specific metadata item.
     * This callback is optional: if not provided, filters are not applied to any item
     * @param esSearchParams Search parameters to apply any user selected filters
     * @param metadata The metadata on which to apply the filters
     * @returns Whether metadata passes the filters or not
     */
    applyFilters: (esSearchParams: ESSearchParameters, metadata: ESItemMetadata) => boolean;

    /**
     * Perform a custom action when a deletion event deletes an item's content, specified by its ID.
     * @param ID The ID of the item being deleted
     * @param indexKey The symmetric key to decrypt the item's metadata
     */
    onContentDeletion: (ID: string, indexKey: CryptoKey) => Promise<void>;

    /**
     * Send the API request to fetch the item and return it decrypted. If fetching fails, return undefined.
     * If decryption fails, which can happen for legitimate reasons like password reset, return an empty object
     * This callback is optional: if not provided, content search cannot be enabled, nor can items' content
     * be synced when events happen
     * @param itemID The unique ID used as a primary key in IDB
     * @param abortSignal An AbortSignal object to abort the request
     * @returns A decrypted item, potentially without content, or undefined if something fails and itemMetadata is not provided or if there was an error
     */
    fetchESItemContent?: (itemID: string, signal?: AbortSignal) => Promise<{ content?: ESItemContent; error?: any }>;

    /**
     * Called on key reactivation, attempt to decrypt items stored as undecryptable inside IDB
     * @returns The count of items that were successfully decrypted
     */
    correctDecryptionErrors: (
        userID: string,
        indexKey: CryptoKey,
        abortIndexingRef: React.MutableRefObject<AbortController>,
        esStatus: ESStatusBooleans,
        recordProgress: RecordProgress
    ) => Promise<number>;
}

export type ESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent = void> = RequiredESCallbacks<
    ESItemMetadata,
    ESSearchParameters,
    ESItemContent
> &
    Partial<OptionalESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent>>;

export type InternalESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent = void> = RequiredESCallbacks<
    ESItemMetadata,
    ESSearchParameters,
    ESItemContent
> &
    OptionalESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent>;
