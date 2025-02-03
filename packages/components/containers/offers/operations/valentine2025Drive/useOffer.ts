import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { valentineDrive2025 } from './configuration';
import { getIsEligible } from './eligibility';

export const useValentine2025Drive = (): Operation => {
    const protonConfig = useConfig();
    const [user, loadingUser] = useUser();
    const [, loadingSubscription] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(valentineDrive2025);

    const isEligible = getIsEligible({ user, protonConfig });

    return {
        isValid: isEligible && isActive,
        config: valentineDrive2025,
        isLoading: flagsLoading || loadingUser || loadingSubscription,
        isEligible,
    };
};
