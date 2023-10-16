import { useConfig, useLastSubscriptionEnd, useSubscription, useUser } from '@proton/components/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import config from './configuration';
import isEligible from './eligibility';

const useOffer = () => {
    const [user, userLoading] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const [lastSubscriptionEnd, lastSubscriptionEndLoading] = useLastSubscriptionEnd();
    const protonConfig = useConfig();
    const isLoading = flagsLoading || userLoading || subscriptionLoading || lastSubscriptionEndLoading;
    const isValid = isEligible({ subscription, protonConfig, user, lastSubscriptionEnd }) && isActive;

    return { isValid, config, isLoading };
};

export default useOffer;
