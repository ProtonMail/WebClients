import { useEffect, useMemo, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { useApi, useConfig } from '@proton/components';
import { useDrive } from '@proton/drive';
import { queryLatestVolumeEvent } from '@proton/shared/lib/api/drive/volume';

import { useFlagsDriveFoundationSearch } from '../../flags/useFlagsDriveFoundationSearch';
import type { IndexPopulatorStatus, IndexingProgress, SearchQuery, SearchResultItem } from '../../modules/search';
import { SearchModule, type SearchModuleState } from '../../modules/search';
import { sendErrorReportForSearch } from '../../modules/search/internal/shared/errors';
import { brandSearchUserId } from '../../modules/search/internal/shared/types';

const IDLE_TIMEOUT_MS = 10_000;

/**
 * Schedule a callback to run when the browser is idle, with a fallback to setTimeout.
 * Returns a cleanup function to cancel the scheduled callback.
 */
const scheduleWhenIdle = (callback: () => void): (() => void) => {
    if (typeof requestIdleCallback === 'function') {
        const handle = requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
        return () => cancelIdleCallback(handle);
    }
    const handle = setTimeout(callback, IDLE_TIMEOUT_MS);
    return () => clearTimeout(handle);
};

export type UseSearchModuleReturn =
    | { isAvailable: false }
    | {
          isAvailable: true;
          isInitialIndexing: boolean;
          isSearchable: boolean;
          isRunningOutdatedVersion: boolean;
          // Aggregated indexing progress across all populators.
          indexingProgress: IndexingProgress;

          // Whether the user has opted in to the search experience.
          isUserOptIn: boolean;
          // Persist the opt-in decision and start the search module.
          optIn: () => Promise<void>;
          // Start the search module.
          start: () => Promise<void>;
          // Execute a search query against the indices.
          search: (query: SearchQuery) => AsyncGenerator<SearchResultItem>;
          // Clear all search-related data (DBs, caches, indexes).
          reset: () => Promise<void>;
          // Trigger a re-index for a specific populator by UID.
          reindexPopulator: (uid: string) => Promise<void>;
      };

export const useSearchModule = (): UseSearchModuleReturn => {
    const { APP_VERSION } = useConfig();
    const isFeatureFlagEnabled = useFlagsDriveFoundationSearch();
    const {
        drive,
        internal: { createSearchDriveInstance },
    } = useDrive();

    const [user] = useUser();
    const api = useApi();
    const getUserKeys = useGetUserKeys();

    const [searchModule, setSearchModule] = useState<SearchModule | null>(null);

    const [searchModuleState, setSearchModuleState] = useState<SearchModuleState | null>(null);

    useEffect(function initSearchModuleSingleton() {
        const isSupported = SearchModule.isEnvironmentCompatible();
        const isAvailable = isSupported && isFeatureFlagEnabled;

        if (!isAvailable) {
            return;
        }

        let cancelled = false;

        async function init() {
            try {
                const userId = brandSearchUserId(user.ID);

                const module = await SearchModule.getOrCreate({
                    appVersion: APP_VERSION,
                    userId,
                    driveClient: drive,
                    createSearchDriveInstance,
                    fetchLastEventIdForTreeScopeId: (treeEventScopeId, abortSignal) =>
                        api<{ EventID: string; Code: number }>({
                            ...queryLatestVolumeEvent(treeEventScopeId),
                            signal: abortSignal.signal,
                        }),
                    getUserKeys,
                });

                if (!cancelled) {
                    setSearchModule(module);
                    setSearchModuleState(module.getState());
                }
            } catch (error) {
                sendErrorReportForSearch('Error while creating Search module', error);
            }
        }

        void init();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(
        function maybeStartWhenIdle() {
            if (!searchModule || !searchModuleState?.isUserOptIn) {
                return;
            }
            return scheduleWhenIdle(() => searchModule.start());
        },
        [searchModule, searchModuleState?.isUserOptIn]
    );

    useEffect(
        function subscribeToStateChange() {
            if (!searchModule) {
                return;
            }
            const unsubscribe = searchModule.onStateChange((newState) => setSearchModuleState(newState));
            return () => unsubscribe();
        },
        [searchModule]
    );

    const returnValue = useMemo((): UseSearchModuleReturn => {
        if (!searchModule || !searchModuleState) {
            return { isAvailable: false };
        }
        return {
            isAvailable: true,
            isInitialIndexing: searchModuleState.isInitialIndexing,
            isSearchable: searchModuleState.isSearchable,
            isRunningOutdatedVersion: searchModuleState.isRunningOutdatedVersion,
            indexingProgress: aggregateIndexingProgress(searchModuleState.indexPopulatorStatuses),

            isUserOptIn: searchModuleState.isUserOptIn,
            optIn: async () => {
                await searchModule.optIn();
                searchModule.start();
            },
            start: async () => searchModule.start(),
            reset: async () => searchModule.reset(),
            reindexPopulator: async (uid: string) => searchModule.reindexPopulator(uid),

            search: (query: SearchQuery) => {
                return searchModule.search(query);
            },
        };
    }, [searchModule, searchModuleState]);

    return returnValue;
};

export const EMPTY_INDEXING_PROGRESS: IndexingProgress = { files: 0, folders: 0, albums: 0, photos: 0 };

export function aggregateIndexingProgress(statuses: IndexPopulatorStatus[]): IndexingProgress {
    return statuses.reduce<IndexingProgress>(
        (acc, p) => ({
            files: acc.files + p.progress.files,
            folders: acc.folders + p.progress.folders,
            albums: acc.albums + p.progress.albums,
            photos: acc.photos + p.progress.photos,
        }),
        EMPTY_INDEXING_PROGRESS
    );
}
