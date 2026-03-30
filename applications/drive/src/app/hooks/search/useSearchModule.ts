import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useApi, useConfig, useNotifications } from '@proton/components';
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
import { SearchDB } from '../../modules/search/internal/shared/SearchDB';
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
          // Persist the opt-in decision and start the search module.
          optIn: () => Promise<void>;
          // Start the search module.
          start: () => void;
          // Defer start until the browser is idle.
          startWhenIdle: () => () => void;
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

    const [isUserOptIn, setIsUserOptIn] = useState(false);

    useEffect(() => {
        if (!searchModule) {
            return;
        }
        const unsubscribe = searchModule.onStateChange((newState) => setSearchModuleState(newState));
        return () => unsubscribe();
    }, [searchModule]);

    // Read the persisted opt-in decision on mount.
    useEffect(() => {
        if (!searchModule) {
            return;
        }
        void SearchDB.open(user.ID).then(async (db) => {
            const optedIn = await db.isOptedIn();
            setIsUserOptIn(optedIn);
        });
    }, [searchModule, user.ID]);

    const { createNotification } = useNotifications();

    const optIn = useCallback(async () => {
        if (!searchModule) {
            return;
        }
        try {
            const db = await SearchDB.open(user.ID);
            await db.setOptedIn();
        } catch (error) {
            Logger.error('Unable to start the search', error);
            // Not a code error — likely a browser/environment issue (e.g. storage full,
            // private browsing restrictions). But at the same time, the search module should have checked
            // all capabilities from the environment, so the user should not even be able to opt in.
            sendErrorReport(error);

            const isQuotaError = error instanceof DOMException && error.name === 'QuotaExceededError';
            const text = isQuotaError
                ? c('Error').t`Unable to start the search: not enough storage space`
                : c('Error').t`Unable to start the search`;
            createNotification({ text, type: 'error' });
            return;
        }
        setIsUserOptIn(true);
        searchModule.start();
    }, [searchModule, user.ID, createNotification]);

    const returnValue = useMemo((): UseSearchModuleReturn => {
        if (!searchModule || !searchModuleState) {
            return { isAvailable: false };
        }
        return {
            isAvailable: true,
            isInitialIndexing: searchModuleState.isInitialIndexing,
            isSearchable: searchModuleState.isSearchable,
            isRunningOutdatedVersion: searchModuleState.isRunningOutdatedVersion,

            isUserOptIn,
            optIn,
            start: () => searchModule.start(),
            startWhenIdle: () => {
                const IDLE_TIMEOUT_MS = 10_000;
                if (typeof requestIdleCallback === 'function') {
                    const handle = requestIdleCallback(() => searchModule.start(), { timeout: IDLE_TIMEOUT_MS });
                    return () => cancelIdleCallback(handle);
                }
                const handle = setTimeout(() => searchModule.start(), IDLE_TIMEOUT_MS);
                return () => clearTimeout(handle);
            },

            // TODO: Implement
            reset: async () => {
                window.alert('TBD: Reset search DBs');
            },

            search: (query: SearchQuery) => {
                return searchModule.search(query);
            },
        };
    }, [searchModule, searchModuleState, isUserOptIn, optIn]);

    return returnValue;
};
