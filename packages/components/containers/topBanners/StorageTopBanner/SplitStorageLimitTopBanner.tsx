import type { Subscription } from '@proton/payments/index';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { SpaceState, getCompleteSpaceDetails, getPlanToUpsell, type getSpace } from '@proton/shared/lib/user/storage';

import TopBanner from '../TopBanner';
import { getStorageFull } from './helperStorageBanner';

export const SplitStorageLimitTopBanner = ({
    app,
    user,
    subscription,
    upsellRef,
    ignoreStorageLimit,
    setIgnoreStorageLimit,
    space,
}: {
    app: APP_NAMES;
    user: UserModel;
    subscription: Subscription | undefined;
    upsellRef: string | undefined;
    ignoreStorageLimit: boolean;
    setIgnoreStorageLimit: (value: boolean) => void;
    space: ReturnType<typeof getSpace>;
}) => {
    const details = getCompleteSpaceDetails(space);
    const plan = getPlanToUpsell({ storageDetails: details, app });

    if (details.base.type === SpaceState.Danger && details.drive.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger">
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: app === APPS.PROTONDRIVE ? details.drive.displayed : details.base.displayed,
                    mode: 'both',
                    app,
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    if (details.base.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger">
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: details.base.displayed,
                    mode: 'mail',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    if (details.drive.type === SpaceState.Danger && app === APPS.PROTONDRIVE) {
        return (
            <TopBanner className="bg-danger">
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: details.drive.displayed,
                    mode: 'drive',
                    upsellRef,
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
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: app === APPS.PROTONDRIVE ? details.drive.displayed : details.base.displayed,
                    mode: app === APPS.PROTONDRIVE ? 'drive' : 'mail',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    if (details.drive.type === SpaceState.Warning && app === APPS.PROTONDRIVE) {
        return (
            <TopBanner className="bg-warning" onClose={() => setIgnoreStorageLimit(true)}>
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: details.drive.displayed,
                    mode: 'drive',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    if (details.base.type === SpaceState.Warning) {
        return (
            <TopBanner className="bg-warning" onClose={() => setIgnoreStorageLimit(true)}>
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: details.base.displayed,
                    mode: 'mail',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    return null;
};
