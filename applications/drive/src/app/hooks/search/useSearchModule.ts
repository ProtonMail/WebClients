import { useEffect, useMemo, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useDrive } from '@proton/drive';

import { useFlagsDriveFoundationSearch } from '../../flags/useFlagsDriveFoundationSearch';
import type { SearchQuery, SearchResult } from '../../modules/search';
import {
    SearchLatestEventIdProvider,
    SearchModule,
    type SearchModuleState,
    type UserId as SearchUserID,
} from '../../modules/search';

export type UseSearchModuleReturn =
    | { isAvailable: false }
    | {
          isAvailable: true;
          isInitialIndexing: boolean;
          isSearchable: boolean;
          // Whether the user has opted in to the search experience.
          isUserOptIn: boolean;
          // Opt the user in to the search experience.
          optIn: () => Promise<void>;
          // Execute a search query against the indices.
          search: (query: SearchQuery) => Promise<SearchResult>;
          // Clear all search-related data (DBs, caches, indexes).
          reset: () => Promise<void>;
      };

export const useSearchModule = (): UseSearchModuleReturn => {
    const isFeatureFlagEnabled = useFlagsDriveFoundationSearch();
    const {
        drive,
        internal: { createSearchDriveInstance },
    } = useDrive();

    const [user] = useUser();

    const [searchModule] = useState(() => {
        const isSupported = SearchModule.isEnvironmentCompatible();
        const isAvailable = isSupported && isFeatureFlagEnabled;

        if (!isAvailable) {
            return null;
        }

        const latestEventIdProvider = new SearchLatestEventIdProvider();
        const driveClientForSearchEvents = createSearchDriveInstance({
            latestEventIdProvider,
        });

        return SearchModule.getOrCreate({
            userId: user.ID as SearchUserID,
            driveClient: drive,
            driveClientForSearchEvents,
            latestEventIdProvider,
        });
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

            // TODO: Implement
            search: async (_query: SearchQuery): Promise<SearchResult> => {
                return Promise.resolve({
                    nodeUids: [],
                });
            },

            // TODO: Implement
            isUserOptIn: true,
            // TODO: Implement
            optIn: async () => {
                window.alert('TBD: Optin');
            },

            // TODO: Implement
            reset: async () => {
                window.alert('TBD: Reset search DBs');
            },
        };
    }, [searchModule, searchModuleState]);

    return returnValue;
};
