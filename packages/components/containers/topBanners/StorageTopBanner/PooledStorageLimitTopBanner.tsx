import { SpaceState, getCompleteSpaceDetails, type getSpace } from '@proton/shared/lib/user/storage';

import TopBanner from '../TopBanner';
import { StorageUpgradeCta } from './StorageUpgradeCta';
import { getPooledStorageBannerText } from './helperStorageBanner';

export const PooledStorageLimitTopBanner = ({
    ignoreStorageLimit,
    setIgnoreStorageLimit,
    space,
}: {
    ignoreStorageLimit: boolean;
    setIgnoreStorageLimit: (value: boolean) => void;
    space: ReturnType<typeof getSpace>;
}) => {
    const details = getCompleteSpaceDetails(space);
    const upgrade = <StorageUpgradeCta />;

    if (details.pooled.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger" data-testid="storage-banner:pooled-storage">
                {getPooledStorageBannerText({
                    percentage: details.pooled.displayed,
                    upgrade,
                })}
            </TopBanner>
        );
    }

    if (ignoreStorageLimit) {
        return null;
    }

    if (details.pooled.type === SpaceState.Warning) {
        return (
            <TopBanner
                className="bg-warning"
                onClose={() => setIgnoreStorageLimit(true)}
                data-testid="storage-banner:pooled-storage"
            >
                {getPooledStorageBannerText({
                    percentage: details.pooled.displayed,
                    upgrade,
                })}
            </TopBanner>
        );
    }

    return null;
};
