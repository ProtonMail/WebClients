import { useConfig, useSubscription, useUser } from '@proton/components/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import { Operation } from '../../interface';
import config from './configuration';
import getIsEligible from './eligibility';

const useOffer = (): Operation => {
    const [user, userLoading] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const protonConfig = useConfig();
    const isLoading = flagsLoading || userLoading || subscriptionLoading;
    const isEligible = getIsEligible({ subscription, protonConfig, user });
    const isValid = isEligible && isActive;

    return { isValid, config, isLoading, isEligible };
};

export default useOffer;
