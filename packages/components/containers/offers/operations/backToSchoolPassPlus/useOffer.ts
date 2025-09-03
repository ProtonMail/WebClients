import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { backToSchoolPassPlus } from './configuration';
import { getIsEligible } from './eligibility';

export const useBackToSchoolPassPlus = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const { isActive, loading: flagsLoading } = useOfferFlags(backToSchoolPassPlus);
    const isEligible = getIsEligible({ user, subscription, protonConfig, offerConfig: backToSchoolPassPlus });

    return {
        isValid: isEligible && isActive,
        config: backToSchoolPassPlus,
        isLoading: flagsLoading || loadingUser || loadSubscription,
        isEligible,
    };
};
