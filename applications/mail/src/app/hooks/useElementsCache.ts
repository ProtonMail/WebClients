import { useCache } from 'react-components';

import { Element } from '../models/element';
import { Page, Filter, Sort } from '../models/tools';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

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
}

export const useElementsCache = (
    initialCache?: ElementsCache
): [ElementsCache, Dispatch<SetStateAction<ElementsCache>>] => {
    const cache = useCache();
    const [, forceRefresh] = useState({});

    let elementsCache = cache.get(ELEMENTS_CACHE_KEY);

    if (elementsCache === undefined && initialCache) {
        cache.set(ELEMENTS_CACHE_KEY, initialCache);
        elementsCache = initialCache;
    }

    const setElementsCache = (setStateAction: SetStateAction<ElementsCache>) => {
        cache.set(
            ELEMENTS_CACHE_KEY,
            setStateAction instanceof Function ? setStateAction(cache.get(ELEMENTS_CACHE_KEY)) : setStateAction
        );
    };

    useEffect(
        () =>
            cache.subscribe((changedKey: string) => {
                if (changedKey === ELEMENTS_CACHE_KEY) {
                    forceRefresh({});
                }
            }),
        []
    );

    return [elementsCache, setElementsCache];
};
