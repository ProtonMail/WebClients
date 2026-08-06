import type { CategoryLabelID } from '@proton/shared/lib/constants';
import type { SimpleMap } from '@proton/shared/lib/interfaces';
import type { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import type { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';
import type { Filter, SearchParameters, Sort } from '@proton/shared/lib/mail/search';

import type { Element } from '../../models/element';
import type { LabelIDsChanges } from '../../models/event';

export interface ElementsStateParams {
    labelID: string;
    elementID?: string;
    messageID?: string;
    /**
     * List of categories that are displayed, acts as a filter like `sort` or `filter`
     * Only set when `labelID` is Inbox, set to empty array elsewhere.
     */
    categoryIDs: CategoryLabelID[];
    conversationMode: boolean;
    sort: Sort;
    filter: Filter;
    search: SearchParameters;
    esEnabled: boolean;
    isSearching: boolean;
    newsletterSubscriptionID?: string;
}

export interface RetryData {
    payload: any;
    count: number;
    error: Error | undefined;
}

export interface TaskRunningInfo {
    labelIDs: string[];
    timeoutID: NodeJS.Timeout | undefined;
}

export interface ElementsState {
    /**
     * True when the first request has not been sent
     * Allow to show a loading state even before the first request is sent
     */
    beforeFirstLoad: boolean;

    /**
     * The cache is invalidated and the request should be re-sent
     */
    invalidated: boolean;

    /**
     * A request is currently pending
     */
    pendingRequest: boolean;

    /**
     * An action is pending backend side on the element list and it shouldnt be refreshed yet
     */
    pendingActions: number;

    /**
     * Number of Encrypted Search runs in flight. Mirrored from ES's React state because every result
     * batch clears `pendingRequest`, so the loading flag can't tell a finished search from a batched one.
     * A count, not a boolean: a load-more run can overlap the search that started it.
     */
    pendingESSearches: number;

    /**
     * Whether the elements now in state were produced by Encrypted Search rather than the server's
     * metadata-only search. The two are otherwise indistinguishable downstream, and a fallback to the
     * server leaves ES's own status untouched — so this is the only thing that says whether message
     * bodies were searched at all. Undefined before the first load.
     */
    usedEncryptedSearch: boolean | undefined;

    /**
     * Current parameters of the list (label, filter, sort, search)
     */
    params: ElementsStateParams;

    /**
     * Current page number
     */
    page: number;

    /**
     * List of pages number currently in the cache, per "context filter"
     */
    pages: SimpleMap<number[]>;

    /**
     * List of total of elements currently in the cache, per "context filter"
     */
    total: SimpleMap<number>;

    /**
     * Actual cache of elements indexed by there ids
     * Contains all elements loaded since last cache reset
     */
    elements: { [ID: string]: Element };

    /**
     * List of element's id which are allowed to bypass the current filter
     */
    bypassFilter: string[];

    /**
     * Retry data about the last request
     * Keeps track of the last request to count the number of attemps
     */
    retry: RetryData;

    /**
     * Labels on which on task is currently running
     */
    taskRunning: TaskRunningInfo;

    /**
     * List of context filters for which we are awaiting fresh data from the server.
     */
    awaitingStaleRetry: SimpleMap<boolean>;

    /**
     * Number of elements optimistically deleted since the last successful (non-stale) load.
     * Used to fetch enough additional pages in one go when reloading a backend search after
     * a bulk delete, instead of relying on the default, fixed page fetch count.
     */
    deletedSinceLastLoad: number;
}

export interface QueryParams {
    abortController: AbortController | undefined;
    page: number;
    pageSize: MAIL_PAGE_SIZE;
    count?: number;
    refetch?: boolean;
}

export interface QueryResults {
    abortController: AbortController;
    Total: number;
    Elements: Element[];
    More?: boolean;
    Stale: number;
    /**
     * About TasksRunning:
     * - Returns an empty array when no results
     * - Returns a object when results
     * - TasksRunning key does not exist when LabelID is not present in query params.
     */
    TasksRunning?: { [labelID: string]: any } | string[];
}

export interface NewStateParams {
    page?: number;
    pageSize?: number;
    params?: Partial<ElementsStateParams>;
    retry?: RetryData;
    beforeFirstLoad?: boolean;
}

export interface EventUpdates {
    conversationMode: boolean;
    toCreate: (Element & LabelIDsChanges)[];
    toUpdate: (Element & LabelIDsChanges)[];
    toLoad: (Element & LabelIDsChanges)[];
    toDelete: string[];
}

export interface ESResults {
    page: number;
    elements: Element[];
    params: ElementsStateParams;
    pageSize: MAIL_PAGE_SIZE;
}

export interface OptimisticUpdates {
    elements: Element[];
    isMove?: boolean;
    bypass?: boolean;
    conversationMode?: boolean;
    markAsStatus?: MARK_AS_STATUS;
    elementTotalAdjustment?: number;
}

export interface OptimisticDelete {
    elementIDs: string[];
}
