import type { Subscription } from '@proton/payments/index';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { SpaceState, getCompleteSpaceDetails, getPlanToUpsell, type getSpace } from '@proton/shared/lib/user/storage';

import TopBanner from '../TopBanner';
import { getStorageFull } from './helperStorageBanner';

export const PooledStorageLimitTopBanner = ({
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

    if (details.pooled.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger">
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: details.pooled.displayed,
                    mode: app === APPS.PROTONDRIVE ? 'drive' : 'mail',
                    upsellRef,
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
                    plan,
                    user,
                    subscription,
                    percentage: details.pooled.displayed,
                    mode: app === APPS.PROTONDRIVE ? 'drive' : 'mail',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    return null;
};
