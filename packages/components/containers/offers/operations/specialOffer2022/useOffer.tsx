import { useConfig, useSubscription, useUser } from '@proton/components/hooks';
import { APPS, PLANS } from '@proton/shared/lib/constants';
import { getPlan, hasBlackFridayDiscount } from '@proton/shared/lib/helpers/subscription';
import { isExternal } from '@proton/shared/lib/helpers/subscription';

import useOfferFlags from '../../hooks/useOfferFlags';
import { Operation } from '../../interface';
import config from './configuration';

const useOffer = (): Operation => {
    const [user, userLoading] = useUser();
    const [subscription, loading] = useSubscription();
    const plan = getPlan(subscription);
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const { APP_NAME } = useConfig();
    const isMailOrAccountSettings = APP_NAME === APPS.PROTONMAIL || APP_NAME === APPS.PROTONACCOUNT;
    const isLoading = flagsLoading || userLoading || loading;

    const isValid =
        plan?.Name === PLANS.BUNDLE &&
        subscription?.Cycle === 1 &&
        !hasBlackFridayDiscount(subscription) &&
        user.canPay &&
        isMailOrAccountSettings &&
        !user.isDelinquent &&
        !isExternal(subscription) &&
        isActive;

    return { isValid, config, isLoading };
};

export default useOffer;
