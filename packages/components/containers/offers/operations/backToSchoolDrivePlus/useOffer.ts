import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { backToSchoolDrivePlus } from './configuration';
import { getIsEligible } from './eligibility';

export const useBackToSchoolDrivePlus = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const { isActive, loading: flagsLoading } = useOfferFlags(backToSchoolDrivePlus);
    const isEligible = getIsEligible({ user, subscription, protonConfig, offerConfig: backToSchoolDrivePlus });

    return {
        isValid: isEligible && isActive,
        config: backToSchoolDrivePlus,
        isLoading: flagsLoading || loadingUser || loadSubscription,
        isEligible,
    };
};
