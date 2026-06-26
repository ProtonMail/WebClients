import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { getNotificationsManager } from '@proton/drive/modules/notifications';

import { tryCatchWithNotification, useSearchModule, useUrlSearchParams } from '../../../../modules/search';
import { sendErrorReportForSearch } from '../../../../modules/search/internal/shared/errors';
import { useSearchViewStore } from '../store';
import type { SearchViewModelAdapter } from '../type';
import { loadNodesForSearchView } from './loadNodesForSearchView';

export const useSearchViewModel = (): SearchViewModelAdapter => {
    const searchModule = useSearchModule();
    const [searchParams] = useUrlSearchParams();

    const [refreshMarker, setRefreshMarker] = useState(0);
    const [isSearching, setIsSearching] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);

    const doSearch = useCallback(async () => {
        abortControllerRef.current?.abort();
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        useSearchViewStore.getState().clearAll();

        if (!searchModule.isAvailable || !searchModule.isSearchable) {
            const errorMsg = 'Doing search query on non-ready search module';
            sendErrorReportForSearch(errorMsg, new Error(errorMsg));
            return;
        }

        setIsSearching(true);

        try {
            // Phase 1: collect all matching UIDs from the WASM engine (fast, in-memory).
            const collectedUids: string[] = [];
            for await (const item of searchModule.search({ filename: searchParams })) {
                if (abortController.signal.aborted) {
                    break;
                }
                collectedUids.push(item.nodeUid);
            }
            // Dedup because the same node can appear in multiple indices.
            const allUids = [...new Set(collectedUids)];

            // Phase 2: stream nodes from the SDK in one call; iterateNodes handles
            // internal API batching. Results appear progressively as they resolve.
            if (!abortController.signal.aborted && allUids.length > 0) {
                useSearchViewStore.getState().setLoading(true);
                const result = await loadNodesForSearchView(allUids, abortController.signal);
                if (result.hadPartialErrors) {
                    getNotificationsManager().createNotification({
                        type: 'error',
                        text: c('Error').t`We were not able to load some search results`,
                    });
                }
            }
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') {
                return;
            }
            if (abortController.signal.aborted) {
                return;
            }
            getNotificationsManager().createNotification({
                type: 'error',
                text: c('Error').t`Search failed`,
            });
            sendErrorReportForSearch('Search query failed', e);
        } finally {
            if (!abortController.signal.aborted) {
                setIsSearching(false);
                useSearchViewStore.getState().setLoading(false);
            }
        }
    }, [searchModule, searchParams]);

    useEffect(() => {
        if (!searchModule.isAvailable || !searchModule.isSearchable) {
            return;
        }
        void doSearch();

        // - Use refreshMarker as a dep to refresh the search when required.
        // - searchModule is not included in deps: we don't want to refetch search results
        //   when the search DB state changes.
        // TODO: Revisit this search triggering logic inherited from legacy search.
    }, [doSearch, refreshMarker]);

    const refresh = useCallback(() => {
        setRefreshMarker((prev) => prev + 1);
    }, []);

    const startIndexing = useCallback(() => {
        if (!searchModule.isAvailable) {
            const errorMsg = 'Start indexing on non-ready search module';
            sendErrorReportForSearch(errorMsg, new Error(errorMsg));
            return;
        }

        // User did some action that requires the search module to start now, like click on
        // "Enable search" button.
        void tryCatchWithNotification(() => searchModule.optIn())();
    }, [searchModule]);

    return {
        isSearchAvailable: searchModule.isAvailable,
        isSearchEnabled: searchModule.isAvailable ? searchModule.isUserOptIn : false,
        isSearchable: searchModule.isAvailable ? searchModule.isSearchable : false,
        startIndexing,
        isSearching,
        refreshResults: refresh,
        indexingProgress: searchModule.isAvailable
            ? searchModule.indexingProgress
            : { files: 0, folders: 0, albums: 0, photos: 0 },
    };
};
