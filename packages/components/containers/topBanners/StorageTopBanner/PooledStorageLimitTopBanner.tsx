import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { SpaceState, getCompleteSpaceDetails, type getSpace } from '@proton/shared/lib/user/storage';

import TopBanner from '../TopBanner';
import { StorageUpgradeCta } from './StorageUpgradeCta';
import { getStorageFull } from './helperStorageBanner';

export const PooledStorageLimitTopBanner = ({
    app,
    ignoreStorageLimit,
    setIgnoreStorageLimit,
    space,
}: {
    app: APP_NAMES;
    ignoreStorageLimit: boolean;
    setIgnoreStorageLimit: (value: boolean) => void;
    space: ReturnType<typeof getSpace>;
}) => {
    const details = getCompleteSpaceDetails(space);
    const upgrade = <StorageUpgradeCta />;

    if (details.pooled.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger">
                {getStorageFull({
                    percentage: details.pooled.displayed,
                    mode: app === APPS.PROTONDRIVE ? 'drive' : 'mail',
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
            <TopBanner className="bg-warning" onClose={() => setIgnoreStorageLimit(true)}>
                {getStorageFull({
                    percentage: details.pooled.displayed,
                    mode: app === APPS.PROTONDRIVE ? 'drive' : 'mail',
                    upgrade,
                })}
            </TopBanner>
        );
    }

    return null;
};
