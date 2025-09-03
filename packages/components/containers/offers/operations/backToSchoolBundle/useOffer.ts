import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { backToSchoolBundle } from './configuration';
import { getIsEligible } from './eligibility';

export const useBackToSchoolBundle = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const { isActive, loading: flagsLoading } = useOfferFlags(backToSchoolBundle);
    const isEligible = getIsEligible({ user, subscription, protonConfig, offerConfig: backToSchoolBundle });

    return {
        isValid: isEligible && isActive,
        config: backToSchoolBundle,
        isLoading: flagsLoading || loadingUser || loadSubscription,
        isEligible,
    };
};
