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
