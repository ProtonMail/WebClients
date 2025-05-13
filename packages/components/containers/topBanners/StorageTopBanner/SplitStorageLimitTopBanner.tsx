import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { SpaceState, getCompleteSpaceDetails, type getSpace } from '@proton/shared/lib/user/storage';

import TopBanner from '../TopBanner';
import { StorageUpgradeCta } from './StorageUpgradeCta';
import { getSplitStorageBannerText } from './helperStorageBanner';

export const SplitStorageLimitTopBanner = ({
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

    if (details.base.type === SpaceState.Danger && details.drive.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger" data-testid="storage-banner:split-storage">
                {getSplitStorageBannerText({
                    percentage: app === APPS.PROTONDRIVE ? details.drive.displayed : details.base.displayed,
                    mode: 'both',
                    upgrade,
                })}
            </TopBanner>
        );
    }

    if (details.base.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger" data-testid="storage-banner:split-storage">
                {getSplitStorageBannerText({
                    percentage: details.base.displayed,
                    mode: 'mail',
                    upgrade,
                })}
            </TopBanner>
        );
    }

    // We only show the top banner if the user is in the drive app and not in the mail app
    if (details.drive.type === SpaceState.Danger && app === APPS.PROTONDRIVE) {
        return (
            <TopBanner className="bg-danger" data-testid="storage-banner:split-storage">
                {getSplitStorageBannerText({
                    percentage: details.drive.displayed,
                    mode: 'drive',
                    upgrade,
                })}
            </TopBanner>
        );
    }

    if (ignoreStorageLimit) {
        return null;
    }

    if (details.drive.type === SpaceState.Warning && details.base.type === SpaceState.Warning) {
        return (
            <TopBanner
                className="bg-warning"
                onClose={() => setIgnoreStorageLimit(true)}
                data-testid="storage-banner:split-storage"
            >
                {getSplitStorageBannerText({
                    percentage: app === APPS.PROTONDRIVE ? details.drive.displayed : details.base.displayed,
                    mode: 'both',
                    upgrade,
                })}
            </TopBanner>
        );
    }

    if (details.drive.type === SpaceState.Warning) {
        return (
            <TopBanner
                className="bg-warning"
                onClose={() => setIgnoreStorageLimit(true)}
                data-testid="storage-banner:split-storage"
            >
                {getSplitStorageBannerText({
                    percentage: details.drive.displayed,
                    mode: 'drive',
                    upgrade,
                })}
            </TopBanner>
        );
    }

    if (details.base.type === SpaceState.Warning) {
        return (
            <TopBanner
                className="bg-warning"
                onClose={() => setIgnoreStorageLimit(true)}
                data-testid="storage-banner:split-storage"
            >
                {getSplitStorageBannerText({
                    percentage: details.base.displayed,
                    mode: 'mail',
                    upgrade,
                })}
            </TopBanner>
        );
    }

    return null;
};
