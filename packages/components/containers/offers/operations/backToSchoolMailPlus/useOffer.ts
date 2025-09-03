import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { backToSchoolMailPlus } from './configuration';
import { getIsEligible } from './eligibility';

export const useBackToSchoolMailPlus = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const { isActive, loading: flagsLoading } = useOfferFlags(backToSchoolMailPlus);
    const isEligible = getIsEligible({ user, subscription, protonConfig, offerConfig: backToSchoolMailPlus });

    return {
        isValid: isEligible && isActive,
        config: backToSchoolMailPlus,
        isLoading: flagsLoading || loadingUser || loadSubscription,
        isEligible,
    };
};
