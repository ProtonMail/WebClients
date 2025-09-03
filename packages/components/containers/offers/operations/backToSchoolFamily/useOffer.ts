import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { backToSchoolFamily } from './configuration';
import { getIsEligible } from './eligibility';

export const useBackToSchoolFamily = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const { isActive, loading: flagsLoading } = useOfferFlags(backToSchoolFamily);
    const isEligible = getIsEligible({ user, subscription, protonConfig, offerConfig: backToSchoolFamily });

    return {
        isValid: isEligible && isActive,
        config: backToSchoolFamily,
        isLoading: flagsLoading || loadingUser || loadSubscription,
        isEligible,
    };
};
