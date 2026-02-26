import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { configuration } from './configuration';
import { getIsEligible } from './eligibility';

export const useOffer = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const { isActive, loading: flagsLoading } = useOfferFlags(configuration);
    const isEligible = getIsEligible({ user, subscription, protonConfig, offerConfig: configuration });

    return {
        isValid: isEligible && isActive,
        config: configuration,
        isLoading: flagsLoading || loadingUser || loadSubscription,
        isEligible,
    };
};
