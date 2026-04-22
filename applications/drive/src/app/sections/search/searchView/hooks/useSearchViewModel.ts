import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useSearchModule } from '../../../../hooks/search/useSearchModule';
import { useUrlSearchParams } from '../../../../hooks/search/useUrlSearchParam';
import { getNotificationsManager } from '../../../../modules/notifications';
import { type SearchResultItem, tryCatchWithNotification } from '../../../../modules/search';
import { sendErrorReport } from '../../../../utils/errorHandling';
import type { SearchViewModelAdapter } from '../type';

export const useSearchViewModel = (): SearchViewModelAdapter => {
    const searchModule = useSearchModule();
    const [searchParams] = useUrlSearchParams();

    const [refreshMarker, setRefreshMarker] = useState(0);
    const [currentResultUids, setCurrentResultUids] = useState<string[]>([]);

    const [isSearching, setIsSearching] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const doSearch = useCallback(async () => {
        abortControllerRef.current?.abort();
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            setIsSearching(true);
            setCurrentResultUids([]);

            if (!searchModule.isAvailable || !searchModule.isSearchable) {
                sendErrorReport(new Error('Doing search query on non-ready search module'));
                return;
            }

            try {
                // Collect all results before updating state: the downstream useEffect
                // that calls loadNodes() depends on resultUids and aborts on every change,
                // so updating state per item would cause repeated abort/restart cycles.
                // TODO: Enable progressive rendering once loadNodes supports incremental loading.
                const collected: SearchResultItem[] = [];
                for await (const item of searchModule.search({ filename: searchParams })) {
                    if (abortController.signal.aborted) {
                        break;
                    }
                    collected.push(item);
                }
                if (!abortController.signal.aborted) {
                    setCurrentResultUids(mergeAndSortResults(collected));
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
                sendErrorReport(e);
            }
        } finally {
            if (!abortController.signal.aborted) {
                setIsSearching(false);
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
            sendErrorReport(new Error('Start indexing on non-ready search module'));
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
        resultUids: currentResultUids,
        refreshResults: refresh,
        indexingProgress: searchModule.isAvailable
            ? searchModule.indexingProgress
            : { files: 0, folders: 0, albums: 0, photos: 0 },
    };
};

/**
 * Deduplicates search results by nodeUid (keeping the highest score)
 * and returns uids sorted by descending score.
 */
export function mergeAndSortResults(items: SearchResultItem[]): string[] {
    const best = new Map<string, number>();
    for (const { nodeUid, score } of items) {
        const existing = best.get(nodeUid);
        if (existing === undefined || score > existing) {
            best.set(nodeUid, score);
        }
    }
    return [...best.entries()]
        .sort(([uidA, scoreA], [uidB, scoreB]) => scoreB - scoreA || uidA.localeCompare(uidB))
        .map(([uid]) => uid);
}
