import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import useLastSubscriptionEnd from '@proton/components/hooks/useLastSubscriptionEnd';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { anniversary2025VPNPlus } from './configuration';
import { getIsEligible } from './eligibility';

export const useAnniversary2025VPNPlus = (): Operation => {
    const protonConfig = useConfig();
    const [user, loadingUser] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(anniversary2025VPNPlus);
    const [lastSubscriptionEnd, loadingLastSubscriptionEnd] = useLastSubscriptionEnd();
    const isEligible = getIsEligible({ user, protonConfig, lastSubscriptionEnd, subscription });

    return {
        isValid: isEligible && isActive,
        config: anniversary2025VPNPlus,
        isLoading: flagsLoading || loadingUser || loadingSubscription || loadingLastSubscriptionEnd,
        isEligible,
    };
};
