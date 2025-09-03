import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { backToSchoolDuo } from './configuration';
import { getIsEligible } from './eligibility';

export const useBackToSchoolDuo = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const { isActive, loading: flagsLoading } = useOfferFlags(backToSchoolDuo);
    const isEligible = getIsEligible({ user, subscription, protonConfig, offerConfig: backToSchoolDuo });

    return {
        isValid: isEligible && isActive,
        config: backToSchoolDuo,
        isLoading: flagsLoading || loadingUser || loadSubscription,
        isEligible,
    };
};
