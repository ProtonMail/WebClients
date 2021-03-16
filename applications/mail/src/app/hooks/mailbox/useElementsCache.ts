import { SetStateAction, useCallback, useEffect, useState } from 'react';
import { useCache } from 'react-components';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { Element } from '../../models/element';
import { Page, Filter, Sort } from '../../models/tools';
import { useMessageCache, getLocalID } from '../../containers/MessageProvider';
import { useConversationCache } from '../../containers/ConversationProvider';

export const ELEMENTS_CACHE_KEY = 'Elements';

export interface ElementsCacheParams {
    labelID: string;
    sort: Sort;
    filter: Filter;
    address?: string;
    from?: string;
    to?: string;
    keyword?: string;
    begin?: number;
    end?: number;
    attachments?: number;
    wildcard?: number;
}

export interface ElementsCache {
    beforeFirstLoad: boolean;
    invalidated: boolean;
    pendingRequest: boolean;
    params: ElementsCacheParams;
    page: Page;
    pages: number[];
    elements: { [ID: string]: Element };
    updatedElements: string[];
    bypassFilter: string[];
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
