import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { backToSchoolVPNPlus } from './configuration';
import { getIsEligible } from './eligibility';

export const useBackToSchoolVPNPlus = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const { isActive, loading: flagsLoading } = useOfferFlags(backToSchoolVPNPlus);
    const isEligible = getIsEligible({ user, subscription, protonConfig, offerConfig: backToSchoolVPNPlus });

    return {
        isValid: isEligible && isActive,
        config: backToSchoolVPNPlus,
        isLoading: flagsLoading || loadingUser || loadSubscription,
        isEligible,
    };
};
