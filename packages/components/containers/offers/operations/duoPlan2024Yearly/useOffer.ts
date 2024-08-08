import { useConfig, useSubscription, useUser } from '@proton/components/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import config from './configuration';
import getIsEligible from './eligibility';

const useOffer = (): Operation => {
    const [user, loadingUser] = useUser();
    const protonConfig = useConfig();
    const [subscription, subscriptionLoading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const isLoading = flagsLoading || loadingUser || subscriptionLoading;
    const isEligible = getIsEligible({ subscription, user, protonConfig });
    const isValid = isEligible && isActive;

    return { isValid, config, isLoading, isEligible };
};

export default useOffer;
