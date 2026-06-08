import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { isPaidSubscription } from '@proton/payments/core/type-guards';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { configuration } from './configuration';
import { getIsEligible } from './eligibility';

export const useOffer = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const paidSubscription = isPaidSubscription(subscription) ? subscription : undefined;
    const protonConfig = useConfig();
    const [preferredCurrency, loadingCurrency] = useAutomaticCurrency();
    const { isActive, loading: flagsLoading } = useOfferFlags(configuration);
    const isEligible = getIsEligible({
        user,
        subscription: paidSubscription,
        protonConfig,
        offerConfig: configuration,
        preferredCurrency,
    });

    return {
        isValid: isEligible && isActive,
        config: configuration,
        isLoading: flagsLoading || loadingUser || loadingSubscription || loadingCurrency,
        isEligible,
    };
};
