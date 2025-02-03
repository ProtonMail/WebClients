import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { valentineVPNBundle2025 } from './configuration';
import { getIsEligible } from './eligibility';

export const useValentine2025VPNBundle = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(valentineVPNBundle2025);

    const isEligible = getIsEligible({ user, subscription });

    return {
        isValid: isEligible && isActive,
        config: valentineVPNBundle2025,
        isLoading: flagsLoading || loadingUser || loadSubscription,
        isEligible,
    };
};
