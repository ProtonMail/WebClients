import { useConfig, useSubscription, useUser } from '@proton/components/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import config from './configuration';
import isEligible from './eligibility';

const useOffer = () => {
    const [user, userLoading] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const protonConfig = useConfig();
    const isLoading = flagsLoading || userLoading || subscriptionLoading;
    const isValid = isEligible({ subscription, protonConfig, user }) && isActive;

    return { isValid, config, isLoading };
};

export default useOffer;
