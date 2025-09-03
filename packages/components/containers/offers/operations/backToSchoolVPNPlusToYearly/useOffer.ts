import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { backToSchoolVPNPlusToYearly } from './configuration';
import { getIsEligible } from './eligibility';

export const useBackToSchoolVPNPlusToYearly = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const { isActive, loading: flagsLoading } = useOfferFlags(backToSchoolVPNPlusToYearly);
    const isEligible = getIsEligible({ user, subscription, protonConfig, offerConfig: backToSchoolVPNPlusToYearly });

    return {
        isValid: isEligible && isActive,
        config: backToSchoolVPNPlusToYearly,
        isLoading: flagsLoading || loadingUser || loadSubscription,
        isEligible,
    };
};
