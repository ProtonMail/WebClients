import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { backToSchoolMailPlusToYearly } from './configuration';
import { getIsEligible } from './eligibility';

export const useBackToSchoolMailPlusToYearly = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const { isActive, loading: flagsLoading } = useOfferFlags(backToSchoolMailPlusToYearly);
    const isEligible = getIsEligible({ user, subscription, protonConfig, offerConfig: backToSchoolMailPlusToYearly });

    return {
        isValid: isEligible && isActive,
        config: backToSchoolMailPlusToYearly,
        isLoading: flagsLoading || loadingUser || loadSubscription,
        isEligible,
    };
};
