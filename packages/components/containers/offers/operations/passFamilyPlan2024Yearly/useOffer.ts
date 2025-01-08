import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { passFamilyPlan2024YearlyConfig } from './configuration';
import { getIsEligible } from './eligibility';

export const usePassFamilyPlan2024Yearly = (): Operation => {
    const [user, loadingUser] = useUser();
    const protonConfig = useConfig();
    const [subscription, subscriptionLoading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(passFamilyPlan2024YearlyConfig);
    const isLoading = flagsLoading || loadingUser || subscriptionLoading;
    const isEligible = getIsEligible({ subscription, user, protonConfig });
    const isValid = isEligible && isActive;

    return { isValid, config: passFamilyPlan2024YearlyConfig, isLoading, isEligible };
};
