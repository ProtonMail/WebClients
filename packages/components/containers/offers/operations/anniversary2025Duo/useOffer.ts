import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { anniversary2025Duo } from './configuration';
import { getIsEligible } from './eligibility';

export const useAnniversary2025Duo = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const { isActive, loading: flagsLoading } = useOfferFlags(anniversary2025Duo);
    const isEligible = getIsEligible({ user, subscription, protonConfig });

    return {
        isValid: isEligible && isActive,
        config: anniversary2025Duo,
        isLoading: flagsLoading || loadingUser || loadSubscription,
        isEligible,
    };
};
