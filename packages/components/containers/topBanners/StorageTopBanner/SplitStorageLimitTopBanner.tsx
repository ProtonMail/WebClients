import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { SpaceState, getCompleteSpaceDetails, type getSpace } from '@proton/shared/lib/user/storage';

import TopBanner from '../TopBanner';
import { StorageUpgradeCta } from './StorageUpgradeCta';
import { generateStorageBannerText } from './helperStorageBanner';

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
            <TopBanner className="bg-danger">
                {generateStorageBannerText({
                    percentage: app === APPS.PROTONDRIVE ? details.drive.displayed : details.base.displayed,
                    mode: 'both',
                    app,
                    upgrade,
                })}
            </TopBanner>
        );
    }

    if (details.base.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger">
                {generateStorageBannerText({
                    percentage: details.base.displayed,
                    mode: 'mail',
                    upgrade,
                })}
            </TopBanner>
        );
    }

    if (details.drive.type === SpaceState.Danger && app === APPS.PROTONDRIVE) {
        return (
            <TopBanner className="bg-danger">
                {generateStorageBannerText({
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
            <TopBanner className="bg-warning" onClose={() => setIgnoreStorageLimit(true)}>
                {generateStorageBannerText({
                    percentage: app === APPS.PROTONDRIVE ? details.drive.displayed : details.base.displayed,
                    mode: app === APPS.PROTONDRIVE ? 'drive' : 'mail',
                    upgrade,
                })}
            </TopBanner>
        );
    }

    if (details.drive.type === SpaceState.Warning && app === APPS.PROTONDRIVE) {
        return (
            <TopBanner className="bg-warning" onClose={() => setIgnoreStorageLimit(true)}>
                {generateStorageBannerText({
                    percentage: details.drive.displayed,
                    mode: 'drive',
                    upgrade,
                })}
            </TopBanner>
        );
    }

    if (details.base.type === SpaceState.Warning) {
        return (
            <TopBanner className="bg-warning" onClose={() => setIgnoreStorageLimit(true)}>
                {generateStorageBannerText({
                    percentage: details.base.displayed,
                    mode: 'mail',
                    upgrade,
                })}
            </TopBanner>
        );
    }

    return null;
};
