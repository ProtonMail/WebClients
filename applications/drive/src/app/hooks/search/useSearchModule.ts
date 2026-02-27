import { useMemo } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useDrive } from '@proton/drive';

import { useFlagsDriveFoundationSearch } from '../../flags/useFlagsDriveFoundationSearch';
import { SearchLatestEventIdProvider, SearchModule, type UserId as SearchUserID } from '../../modules/search';

export const useSearchModule = () => {
    const isFeatureFlagEnabled = useFlagsDriveFoundationSearch();
    const {
        drive,
        internal: { createSearchDriveInstance },
    } = useDrive();

    const [user] = useUser();

    const searchModuleStatus = useMemo(() => {
        const isSupported = SearchModule.isEnvironmentCompatible();
        const isAvailable = isSupported && isFeatureFlagEnabled;

        if (!isAvailable) {
            return {
                isAvailable: false as const,
                searchModule: null,
            };
        }

        const latestEventIdProvider = new SearchLatestEventIdProvider();
        const driveClientForSearchEvents = createSearchDriveInstance({
            latestEventIdProvider,
        });

        const searchModule = SearchModule.getOrCreate({
            userId: user.ID as SearchUserID,
            driveClient: drive,
            driveClientForSearchEvents,
            latestEventIdProvider,
        });
        return {
            isAvailable: true as const,
            searchModule,
        };
    }, [drive, isFeatureFlagEnabled, createSearchDriveInstance, user]);

    return searchModuleStatus;
};
