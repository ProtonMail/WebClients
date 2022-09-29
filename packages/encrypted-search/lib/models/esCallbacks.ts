import { GetItemInfo } from './esFunctions';
import { ESCache, ESEvent, EventsObject } from './interfaces';

/**
 * Interface for all the helpers that are required to run the basic
 * functionalities of the ES library. All products must pass these
 * callbacks in order to use the library
 */
interface RequiredESHelpers<ESItemMetadata, ESSearchParameters> {
    /**
     * Retrieve a batch of items' metadata, the mechanism to keep track of where the fetching
     * has arrived is supposed to be built-in (but can optionally take a boolean indicating whether
     * to store progress in IDB or only in memory. It defaults to true, i.e. store in IDB too.)
     * @param signal an abort signal to abort potential API calls in case of sudden aborts
     * @returns An array of metadata items, i.e. the next batch of items that need to be indexed,
     * as well as a callback to set the recovery point in IndexedDB for the next call to queryItemsMetadata
     * to start from. This ensures that the recovery point is stored only when and if all associated items
     * are actually indexed. Note that this is optional and if not returned, no recovery point is set
     */
    queryItemsMetadata: (signal: AbortSignal) => Promise<{
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
     * Test whether any filter or keyword applies to a specific metadata item. This is needed only for content
     * search as we wish to pre-filter items whose content needs to be fetched and decrypted from disk
     * @param esSearchParams Search parameters to apply any user selected keywords on itemToSearch
     * @param metadata The metadata on which to apply the filters
     * @param filterOnly Specify whether to only apply filters, without testing if the keyword(s) inside
     * the search parameters is found in any of the textual metadata. This parameter is optional and it
     * should default to false, i.e. keywords are always searched
     * @returns Whether metadata passes the filters or not
     */
    searchMetadata: (esSearchParams: ESSearchParameters, metadata: ESItemMetadata, filterOnly?: boolean) => boolean;

    /**
     * Return the total number of items (e.g. mails in mail, files in drive, ...)
     * @returns The total number of items
     */
    getTotalItems: () => Promise<number>;

    /**
     * Read the last event according to which IDB was sycned from local storage and
     * return all new events that need to be synced, whether a refresh is needed and
     * the event ID(s) to catch up the next time
     * @returns @param newEvents An array of events that need to be synced
     * @returns @param shouldRefresh Whether a hard reset of IDB is needed, i.e. erasing it and re-index
     * @returns @param eventsToStore The EventsObject containing all of the last events to be stored in
     * local storage for the next catch-up
     */
    getEventFromIDB: () => Promise<{
        newEvents: ESEvent<ESItemMetadata>[];
        shouldRefresh: boolean;
        eventsToStore: EventsObject;
    }>;
}

/**
 * Interface for all the helpers that are optional and give access to
 * functionalities which are not essential for the correct functioning of the ES library.
 * Each callback description details what happens if the callback is not specified. Note
 * that for internal purposes these callbacks will be assigned a default behaviour
 */
interface MockedESHelpers<ESSearchParameters, ESItemContent = void> {
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
     * Decide whether the decrypted content should be returned as a search result
     * This callback is optional: if not provided, no content, if any, will result in a match. Note that
     * this is only needed in case the product specifies a content to index
     * @param esSearchParams Search parameters to apply any user selected keywords on itemToSearch
     * @param itemToSearch The item on which to apply the search
     * @returns Whether itemToSearch is a search result or not
     */
    searchContent: (esSearchParams: ESSearchParameters, itemToSearch: ESItemContent) => boolean;
}

/**
 * Interface for all the helpers that are optional and give access to
 * functionalities which are not essential for the correct functioning of the ES library.
 * Each callback description details what happens if the callback is not specified. Note
 * that for internal purposes these callbacks will remain undefined and their existence
 * is checked to trigger the extra functionalities they allow
 */
interface OptionalESHelpers<ESItemMetadata, ESItemContent = void> {
    /**
     * Send the API request to fetch the item and return it decrypted. If anything fails, return undefined
     * This callback is optional: if not provided, content search cannot be enabled, nor can items be synced
     * when events happen
     * @param itemID The unique ID used as a primary key in IDB
     * @param abortSignal An AbortSignal object to abort the request
     * @param esCacheRef A reference object to the ES cache, used in case more metadata of items from cache
     * are needed for fetching the content
     * @returns A decrypted item, potentially without content, or undefined if something fails and itemMetadata is not provided
     */
    fetchESItem: (
        itemID: string,
        signal?: AbortSignal,
        esCacheRef?: React.MutableRefObject<ESCache<ESItemMetadata, unknown>>
    ) => Promise<ESItemContent | undefined>;
}

export type ESHelpers<ESItemMetadata, ESSearchParameters, ESItemContent = void> = RequiredESHelpers<
    ESItemMetadata,
    ESSearchParameters
> &
    Partial<MockedESHelpers<ESSearchParameters, ESItemContent>> &
    Partial<OptionalESHelpers<ESItemMetadata, ESItemContent>>;

export type InternalESHelpers<ESItemMetadata, ESSearchParameters, ESItemContent = void> = RequiredESHelpers<
    ESItemMetadata,
    ESSearchParameters
> &
    MockedESHelpers<ESSearchParameters, ESItemContent> &
    Partial<OptionalESHelpers<ESItemMetadata, ESItemContent>>;
