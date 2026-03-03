import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { configuration } from './configuration';
import { getIsEligible } from './eligibility';

export const useOffer = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const [preferredCurrency, loadingCurrency] = useAutomaticCurrency();
    const { isActive, loading: flagsLoading } = useOfferFlags(configuration);
    const isEligible = getIsEligible({ user, subscription, offerConfig: configuration, preferredCurrency });

    return {
        isValid: isEligible && isActive,
        config: configuration,
        isLoading: flagsLoading || loadingUser || loadSubscription || loadingCurrency,
        isEligible,
    };
};
