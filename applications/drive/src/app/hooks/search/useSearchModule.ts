import { useEffect, useMemo, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useApi, useConfig } from '@proton/components';
import { useDrive } from '@proton/drive';
import { queryLatestVolumeEvent } from '@proton/shared/lib/api/drive/volume';

import { useFlagsDriveFoundationSearch } from '../../flags/useFlagsDriveFoundationSearch';
import type { SearchQuery, SearchResultItem } from '../../modules/search';
import {
    SearchLatestEventIdProvider,
    SearchModule,
    type SearchModuleState,
    type UserId as SearchUserID,
} from '../../modules/search';
import { Logger } from '../../modules/search/internal/shared/Logger';
import { sendErrorReport } from '../../utils/errorHandling';

export type UseSearchModuleReturn =
    | { isAvailable: false }
    | {
          isAvailable: true;
          isInitialIndexing: boolean;
          isSearchable: boolean;
          isRunningOutdatedVersion: boolean;

          // Whether the user has opted in to the search experience.
          isUserOptIn: boolean;
          // Opt the user in to the search experience.
          optIn: () => Promise<void>;
          // Execute a search query against the indices.
          search: (query: SearchQuery) => AsyncGenerator<SearchResultItem>;
          // Clear all search-related data (DBs, caches, indexes).
          reset: () => Promise<void>;
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

    const [searchModule] = useState(() => {
        const isSupported = SearchModule.isEnvironmentCompatible();
        const isAvailable = isSupported && isFeatureFlagEnabled;

        if (!isAvailable) {
            return null;
        }

        const userId = user.ID as SearchUserID;
        const latestEventIdProvider = new SearchLatestEventIdProvider(userId);
        const driveClientForSearchEvents = createSearchDriveInstance({
            latestEventIdProvider,
        });

        try {
            return SearchModule.getOrCreate({
                appVersion: APP_VERSION,
                userId,
                driveClient: drive,
                driveClientForSearchEvents,
                latestEventIdProvider,
                fetchLastEventIdForTreeScopeId: (treeEventScopeId, abortSignal) =>
                    api<{ EventID: string; Code: number }>({
                        ...queryLatestVolumeEvent(treeEventScopeId),
                        signal: abortSignal.signal,
                    }),
            });
        } catch (error) {
            Logger.error('Error while creating Search module', error);
            sendErrorReport(error);
            return null;
        }
    });

    const [searchModuleState, setSearchModuleState] = useState<SearchModuleState | null>(() =>
        searchModule ? searchModule.getState() : null
    );

    useEffect(() => {
        if (!searchModule) {
            return;
        }
        const unsubscribe = searchModule.onStateChange((newState) => setSearchModuleState(newState));
        return () => unsubscribe();
    }, [searchModule]);

    const returnValue = useMemo((): UseSearchModuleReturn => {
        if (!searchModule || !searchModuleState) {
            return { isAvailable: false };
        }
        return {
            isAvailable: true,
            isInitialIndexing: searchModuleState.isInitialIndexing,
            isSearchable: searchModuleState.isSearchable,
            isRunningOutdatedVersion: searchModuleState.isRunningOutdatedVersion,

            // TODO: remove
            isUserOptIn: true,
            // TODO: remove
            optIn: async () => {
                window.alert('TBD: Optin');
            },
            // TODO: Implement
            reset: async () => {
                window.alert('TBD: Reset search DBs');
            },

            search: (query: SearchQuery) => {
                return searchModule.search(query);
            },
        };
    }, [searchModule, searchModuleState]);

    return returnValue;
};
