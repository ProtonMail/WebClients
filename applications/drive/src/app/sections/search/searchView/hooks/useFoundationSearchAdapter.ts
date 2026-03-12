import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';

import { useSearchModule } from '../../../../hooks/search/useSearchModule';
import { useUrlSearchParams } from '../../../../hooks/search/useUrlSearchParam';
import type { SearchResult } from '../../../../modules/search';
import { sendErrorReport } from '../../../../utils/errorHandling';
import type { SearchViewModelAdapter } from '../type';

// An adapter to connect the search libray from foundation to the search ui.
export const useFoundationSearchAdapter = (): SearchViewModelAdapter => {
    const { createNotification } = useNotifications();

    const searchModule = useSearchModule();
    const [searchParams] = useUrlSearchParams();

    const [refreshMarker, setRefreshMarker] = useState(0);
    const [currentResultUids, setCurrentResultUids] = useState<SearchResult>({ nodeUids: [] });

    const [isSearching, setIsSearching] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const doSearch = useCallback(async () => {
        abortControllerRef.current?.abort();
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            setIsSearching(true);

            if (!searchModule.isAvailable || !searchModule.isSearchable) {
                sendErrorReport(new Error('Doing search query on non-ready search module'));
                return;
            }

            try {
                const results = await searchModule.search({
                    filename: searchParams,
                });

                if (abortController.signal.aborted) {
                    return;
                }

                setCurrentResultUids(results);
            } catch (e) {
                if (e instanceof DOMException && e.name === 'AbortError') {
                    return;
                }
                if (abortController.signal.aborted) {
                    return;
                }
                createNotification({
                    type: 'error',
                    text: c('Error').t`Search failed`,
                });
                sendErrorReport(e);
            }
        } finally {
            if (!abortController.signal.aborted) {
                setIsSearching(false);
            }
        }
    }, [createNotification, searchModule, searchParams]);

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
            sendErrorReport(new Error('Start indexing on non-ready search module'));
            return;
        }

        void searchModule.optIn();
    }, [searchModule]);

    return {
        isSearchAvailable: searchModule.isAvailable,
        isSearchEnabled: searchModule.isAvailable ? searchModule.isUserOptIn : false,
        isComputingSearchIndex: searchModule.isAvailable ? searchModule.isInitialIndexing : false,
        startIndexing,
        isSearching,
        resultUids: currentResultUids.nodeUids,
        refreshResults: refresh,
    };
};
