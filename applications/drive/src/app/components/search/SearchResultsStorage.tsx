import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

import { throttle } from '@proton/shared/lib/helpers/function';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import { useSearchIndexingContext } from './indexing/SearchIndexingProvider';
import { convertToFileBrowserItem } from '../sections/Search/utils';
import { ESLink } from './types';
import { extractSearchParameters } from './utils';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import useActiveShare from '../../hooks/drive/useActiveShare';
import { mapLinksToChildren } from '../sections/helpers';
import { createItemId, parseItemId } from './utils';
import { LinkMetaBatchPayloadWithShareId, useSearchAPI } from './useSearchAPI';
import { runInQueueAbortable } from '../../utils/parallelRunners';

interface SearchResultsStorageFunctions {
    clearResults: () => void;
    getResults: () => FileBrowserItem[];
    isSearchInProgress: boolean;
    getLastQuery: () => string;
    runSearch: () => Promise<boolean | void>;
}

type SearchResultProviderProps = {
    children: ReactNode;
};

const SearchResultsContext = createContext<SearchResultsStorageFunctions | null>(null);

export interface SearchFileBrowserItem extends FileBrowserItem {
    ShareID: string;
}

export function SearchResultsStorage() {
    const { encryptedSearch, getESDBStatus } = useSearchIndexingContext();
    const [isSearchInProgress, setSearchInProgress] = useState(false);
    const searchAPI = useSearchAPI();
    const cache = useDriveCache();
    const { activeShareId } = useActiveShare();
    const [resultIds, setResultIds] = useState<string[]>([]);
    const resultsCache = useRef<Map<string, SearchFileBrowserItem>>(new Map());

    const currentSearchAbortController = useRef<AbortController | null>(null);

    const lastQuery = useRef<string>('');
    const location = useLocation();

    const updateLinks = (links: FileBrowserItem[], shareId: string) => {
        links.forEach((link) => {
            const currentLink = resultsCache.current.get(createItemId(shareId, link.LinkID));
            if (!currentLink) {
                return;
            }

            const newLink: SearchFileBrowserItem = {
                ...currentLink,
                HasThumbnail: link.HasThumbnail,
                CachedThumbnailURL: link.CachedThumbnailURL,
            };

            resultsCache.current.set(createItemId(shareId, link.LinkID), newLink);
        });
        setResultIds((results) => [...results]);
    };

    const storeResults = (items: SearchFileBrowserItem[]) => {
        const resultIds = items.map((item) => createItemId(item.ShareID, item.LinkID));
        const newCache = items.reduce((acc, item) => {
            acc.set(createItemId(item.ShareID, item.LinkID), item);
            return acc;
        }, new Map<string, SearchFileBrowserItem>());
        resultsCache.current = newCache;
        setResultIds([...resultIds]);
    };

    const syncWithCache = useCallback(
        throttle(() => {
            const updatedResults = resultIds
                .map((id) => {
                    const { linkId } = parseItemId(id);
                    return cache.get.linkMeta(activeShareId, linkId);
                })
                .filter(isTruthy);
            const browserItems = mapLinksToChildren(updatedResults, () => false);

            updateLinks(browserItems, activeShareId);
        }, 500),
        [resultIds]
    );

    useEffect(() => {
        syncWithCache();
    }, [cache]);

    const buildRequestQueue = (results: ESLink[]) => {
        const metaFetchInfo = results.reduce((acc, resultLink) => {
            const { linkId, shareId } = resultLink;

            if (acc.has(shareId)) {
                const pages = acc.get(shareId)!;
                const lastPage = pages[pages.length - 1];

                if (lastPage.length >= 150) {
                    pages.push([linkId]);
                } else {
                    lastPage.push(linkId);
                }

                return acc;
            }

            acc.set(shareId, [[linkId]]);
            return acc;
        }, new Map<string, string[][]>());

        const tasks: (() => Promise<LinkMetaBatchPayloadWithShareId>)[] = [];
        for (const [shareId, idPages] of metaFetchInfo.entries()) {
            for (const page of idPages) {
                tasks.push(async () => {
                    const linkMetas = await searchAPI.fetchLinkMetas(
                        { shareId, linkIds: page },
                        currentSearchAbortController.current?.signal
                    );
                    const updatedLinks = mapLinksToChildren(linkMetas.Links, () => false);
                    updateLinks(updatedLinks, shareId);
                    return linkMetas;
                });
            }
        }

        return tasks;
    };

    const loadSearchResultsMeta = async (results: ESLink[]) => {
        return runInQueueAbortable(buildRequestQueue(results), 3, currentSearchAbortController.current?.signal);
    };

    const abortActiveSearch = () => {
        currentSearchAbortController.current?.abort();
        currentSearchAbortController.current = new AbortController();
    };

    const runSearch = async () => {
        setSearchInProgress(true);
        abortActiveSearch();

        await encryptedSearch((results: ESLink[]) => {
            storeResults(results.map(convertToFileBrowserItem));
            loadSearchResultsMeta(results)
                .catch((e) => console.warn(`Error loading search results meta: ${e}`))
                .finally(() => {
                    currentSearchAbortController.current = null;
                });

            const status = getESDBStatus();
            if (!status.isSearchPartial) {
                setSearchInProgress(false);
            }
        });
        lastQuery.current = extractSearchParameters(location);
    };

    const getResults = useCallback(() => {
        return resultIds
            .map((id) => {
                return resultsCache.current.get(id);
            })
            .filter(isTruthy);
    }, [resultIds]);

    const clearResults = useCallback(() => {
        storeResults([]);
    }, [storeResults]);

    const getLastQuery = () => lastQuery.current;

    return {
        isSearchInProgress,
        clearResults,
        runSearch,
        getResults,
        getLastQuery,
    };
}

export function SearchResultsStorageProvider({ children }: SearchResultProviderProps) {
    const providerState = SearchResultsStorage();
    return <SearchResultsContext.Provider value={providerState}>{children}</SearchResultsContext.Provider>;
}

export const useSearchResultsStorage = () => {
    const state = useContext(SearchResultsContext);
    if (!state) {
        throw new Error('Trying to use uninitialized SearchResultsStorageProvider');
    }
    return state;
};
