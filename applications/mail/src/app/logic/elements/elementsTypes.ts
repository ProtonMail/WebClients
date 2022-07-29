import { Api } from '@proton/shared/lib/interfaces';

import { Element } from '../../models/element';
import { LabelIDsChanges } from '../../models/event';
import { Filter, SearchParameters, Sort } from '../../models/tools';

export interface ElementsStateParams {
    labelID: string;
    conversationMode: boolean;
    sort: Sort;
    filter: Filter;
    search: SearchParameters;
    esEnabled: boolean;
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
     * List of page number currently in the cache
     */
    pages: number[];

    /**
     * Total of elements returned by the current request
     * Undefined before the request return
     * Warning, if the user perform move actions, this value can be hugely outdated
     */
    total: number | undefined;

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
    api: Api;
    call: () => Promise<void>;
    abortController: AbortController | undefined;
    conversationMode: boolean;
    page: number;
    params: ElementsStateParams;
}

export interface QueryResults {
    abortController: AbortController;
    Total: number;
    Elements: Element[];
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
    params?: Partial<ElementsStateParams>;
    retry?: RetryData;
    beforeFirstLoad?: boolean;
}

export interface EventUpdates {
    api: Api;
    conversationMode: boolean;
    toCreate: (Element & LabelIDsChanges)[];
    toUpdate: (Element & LabelIDsChanges)[];
    toLoad: string[];
    toDelete: string[];
}

export interface ESResults {
    page: number;
    elements: Element[];
}

export interface OptimisticUpdates {
    elements: Element[];
    isMove?: boolean;
    bypass?: boolean;
    conversationMode?: boolean;
}

export interface OptimisticDelete {
    elementIDs: string[];
}
