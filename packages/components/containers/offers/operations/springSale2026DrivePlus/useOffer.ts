import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { configuration } from './configuration';
import { getIsEligible } from './eligibility';

export const useOffer = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const [preferredCurrency, loadingCurrency] = useAutomaticCurrency();
    const { loading: flagsLoading } = useOfferFlags(configuration);
    getIsEligible({
        user,
        subscription,
        protonConfig,
        offerConfig: configuration,
        preferredCurrency,
    });

    return {
        isValid: true,
        config: configuration,
        isLoading: flagsLoading || loadingUser || loadSubscription || loadingCurrency,
        isEligible: true,
    };
};
