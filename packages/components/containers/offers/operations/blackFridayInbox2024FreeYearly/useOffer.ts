import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import useLastSubscriptionEnd from '@proton/components/hooks/useLastSubscriptionEnd';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { blackFriday2024InboxFreeYearlyConfig } from './configuration';
import { getIsEligible } from './eligibility';

export const useBlackFriday2024InboxFreeYearly = (): Operation => {
    const [user, userLoading] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(blackFriday2024InboxFreeYearlyConfig);
    const [lastSubscriptionEnd, lastSubscriptionEndLoading] = useLastSubscriptionEnd();
    const [preferredCurrency, loadingCurrency] = useAutomaticCurrency();
    const protonConfig = useConfig();
    const isLoading =
        flagsLoading || userLoading || subscriptionLoading || lastSubscriptionEndLoading || loadingCurrency;
    const isEligible = getIsEligible({ subscription, protonConfig, user, lastSubscriptionEnd, preferredCurrency });
    const isValid = isEligible && isActive;

    return { isValid, config: blackFriday2024InboxFreeYearlyConfig, isLoading, isEligible };
};
