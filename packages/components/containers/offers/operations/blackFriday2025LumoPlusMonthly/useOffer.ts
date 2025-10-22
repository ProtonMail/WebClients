import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { blackFriday2025LumoPlusMonthlyConfig } from './configuration';
import getIsEligible from './eligibility';

export const useBlackFriday2025LumoPlusMonthly = (): Operation => {
    const [user, userLoading] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(blackFriday2025LumoPlusMonthlyConfig);
    const [preferredCurrency, loadingCurrency] = useAutomaticCurrency();
    const protonConfig = useConfig();
    const isLoading = flagsLoading || userLoading || subscriptionLoading || loadingCurrency;
    const isEligible = getIsEligible({
        subscription,
        protonConfig,
        user,
        offerConfig: blackFriday2025LumoPlusMonthlyConfig,
        preferredCurrency,
    });
    const isValid = isEligible && isActive;

    return { isValid, config: blackFriday2025LumoPlusMonthlyConfig, isLoading, isEligible };
};
