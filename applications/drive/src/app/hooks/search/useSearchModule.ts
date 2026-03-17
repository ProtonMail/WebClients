import { useEffect, useMemo, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/components';
import { useDrive } from '@proton/drive';

import { useFlagsDriveFoundationSearch } from '../../flags/useFlagsDriveFoundationSearch';
import type { SearchQuery, SearchResultItem } from '../../modules/search';
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
            appVersion: APP_VERSION,
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
            isRunningOutdatedVersion: searchModuleState.isRunningOutdatedVersion,

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

            search: (query: SearchQuery) => {
                return searchModule.search(query);
            },
        };
    }, [searchModule, searchModuleState]);

    return returnValue;
};
