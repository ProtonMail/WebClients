import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { goUnlimited2022Config } from './configuration';
import { getIsEligible } from './eligibility';

export const useGoUnlimited2022 = (): Operation => {
    const [user, userLoading] = useUser();
    const [subscription, loading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(goUnlimited2022Config);
    const protonConfig = useConfig();
    const isLoading = flagsLoading || userLoading || loading;
    const isEligible = getIsEligible({ user, subscription, protonConfig }) && isActive;
    const isValid = isEligible && isActive;

    return { isValid, config: goUnlimited2022Config, isLoading, isEligible };
};
