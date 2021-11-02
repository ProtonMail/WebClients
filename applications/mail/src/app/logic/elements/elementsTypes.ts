import { Api } from '@proton/shared/lib/interfaces';
import { Element } from '../../models/element';
import { LabelIDsChanges } from '../../models/event';

export interface Filter {
    [key: string]: number;
}

export interface Sort {
    sort: 'Time' | 'Size';
    desc: boolean;
}

export interface Search {
    address?: string;
    from?: string;
    to?: string;
    keyword?: string;
    begin?: number;
    end?: number;
    attachments?: number;
    wildcard?: number;
}

export interface ElementsStateParams {
    labelID: string;
    sort: Sort;
    filter: Filter;
    search: Search;
    esEnabled: boolean;
}

export interface RetryData {
    payload: any;
    count: number;
    error: Error | undefined;
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
}

export interface QueryParams {
    api: Api;
    conversationMode: boolean;
    page: number;
    params: ElementsStateParams;
}

export interface QueryResults {
    Total: number;
    Elements: Element[];
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
