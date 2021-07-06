import { SetStateAction, useCallback, useEffect, useState } from 'react';
import { useCache } from '@proton/components';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import { Element } from '../../models/element';
import { Filter, Sort } from '../../models/tools';
import { useMessageCache, getLocalID } from '../../containers/MessageProvider';
import { useConversationCache } from '../../containers/ConversationProvider';

export const ELEMENTS_CACHE_KEY = 'Elements';

export interface ElementsCacheParams {
    labelID: string;
    sort: Sort;
    filter: Filter;
    esEnabled: boolean;
    address?: string;
    from?: string;
    to?: string;
    keyword?: string;
    begin?: number;
    end?: number;
    attachments?: number;
    wildcard?: number;
}

export interface RetryData {
    payload: any;
    count: number;
    error: Error | undefined;
}

export interface ElementsCache {
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
    params: ElementsCacheParams;

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
     * List of element's id which have been updated by recent events
     */
    updatedElements: string[];

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

/**
 * Gives an always up to date reference of the list of elements in the list
 * Only MailboxContainer should use this, the value will change a lot
 * If you want to read the cache, prefer the use of useGetElementsCache or even useGetElementsFromIDs
 * @param initialCache Initial value of the cache before the first set
 */
export const useElementsCache = (initialCache?: ElementsCache): ElementsCache => {
    const cache = useCache();
    const [, forceRefresh] = useState({});

    let elementsCache = cache.get(ELEMENTS_CACHE_KEY);

    if (elementsCache === undefined && initialCache) {
        cache.set(ELEMENTS_CACHE_KEY, initialCache);
        elementsCache = initialCache;
    }

    useEffect(
        () =>
            cache.subscribe((changedKey: string) => {
                if (changedKey === ELEMENTS_CACHE_KEY) {
                    forceRefresh({});
                }
            }),
        []
    );

    return elementsCache;
};

export const useGetElementsCache = () => {
    const cache = useCache();

    return useCallback(() => cache.get(ELEMENTS_CACHE_KEY) as ElementsCache, [cache]);
};

export const useSetElementsCache = () => {
    const cache = useCache();

    return useCallback(
        (setStateAction: SetStateAction<ElementsCache>) => {
            cache.set(
                ELEMENTS_CACHE_KEY,
                setStateAction instanceof Function ? setStateAction(cache.get(ELEMENTS_CACHE_KEY)) : setStateAction
            );
        },
        [cache]
    );
};

export const useGetElementsFromIDs = () => {
    const getElementsCache = useGetElementsCache();
    const messageCache = useMessageCache();
    const conversationCache = useConversationCache();

    return useCallback(
        (elementIDs: string[]) => {
            const elementsCache = getElementsCache();
            return elementIDs
                .map((ID: string) => {
                    if (elementsCache.elements[ID]) {
                        return elementsCache.elements[ID];
                    }

                    const localID = getLocalID(messageCache, ID);

                    return messageCache.get(localID)?.data || conversationCache.get(ID)?.Conversation;
                })
                .filter(isTruthy);
        },
        [getElementsCache]
    );
};
