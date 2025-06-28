import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import useLastSubscriptionEnd from '@proton/components/hooks/useLastSubscriptionEnd';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { anniversary2025DrivePlus } from './configuration';
import { getIsEligible } from './eligibility';

export const useAnniversary2025DrivePlus = (): Operation => {
    const protonConfig = useConfig();
    const [user, loadingUser] = useUser();
    const { isActive, loading: flagsLoading } = useOfferFlags(anniversary2025DrivePlus);
    const [subscription, loadingSubscription] = useSubscription();
    const [lastSubscriptionEnd, loadingLastSubscriptionEnd] = useLastSubscriptionEnd();
    const isEligible = getIsEligible({
        user,
        protonConfig,
        lastSubscriptionEnd,
        offerConfig: anniversary2025DrivePlus,
        subscription,
    });

    return {
        isValid: isEligible && isActive,
        config: anniversary2025DrivePlus,
        isLoading: flagsLoading || loadingUser || loadingSubscription || loadingLastSubscriptionEnd,
        isEligible,
    };
};
