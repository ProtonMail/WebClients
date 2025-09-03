import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { backToSchoolPassPlusToYearly } from './configuration';
import { getIsEligible } from './eligibility';

export const useBackToSchoolPassPlusToYearly = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const { isActive, loading: flagsLoading } = useOfferFlags(backToSchoolPassPlusToYearly);
    const isEligible = getIsEligible({ user, subscription, protonConfig, offerConfig: backToSchoolPassPlusToYearly });

    return {
        isValid: isEligible && isActive,
        config: backToSchoolPassPlusToYearly,
        isLoading: flagsLoading || loadingUser || loadSubscription,
        isEligible,
    };
};
