import { DecryptedKey } from '@proton/shared/lib/interfaces';

import { ESDBStatus, ESEvent } from './interfaces';

/**
 * Show or update the search results in the UI
 */
export type ESSetResultsList<ESItem> = (Elements: ESItem[]) => void;

/**
 * Return the user keys
 */
export type GetUserKeys = () => Promise<DecryptedKey[]>;

/**
 * Type of functions
 */
export type EncryptedSearch<ESItem> = (
    setResultsList: ESSetResultsList<ESItem>,
    minimumItems?: number
) => Promise<boolean>;
export type EncryptedSearchExecution<ESItem, ESSearchParameters> = (
    setResultsList: ESSetResultsList<ESItem>,
    esSearchParams: ESSearchParameters,
    minimumItems: number | undefined
) => Promise<boolean>;
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
     * @param minimumItems is the optional smallest number of items that the search is expected to produce.
     * If specified this parameter instructs the search to try finding at least this number of items from disk,
     * both in case of a new search with limited cache and in case of an incremented search
     * @returns a boolean indicating the success of the search
     */
    encryptedSearch: EncryptedSearch<ESItem>;

    /**
     * Insert the <mark></mark> highlighting markdown in a string and returns a string containing it,
     * which then needs to be displayed in the UI. Note that the keywords to highlight are extracted
     * directly with the getSearchParams callback
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
