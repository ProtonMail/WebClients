import { useConfig, useLastSubscriptionEnd, useSubscription, useUser } from '@proton/components/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import { Operation } from '../../interface';
import config from './configuration';
import isEligible from './eligibility';

const useOffer = (): Operation => {
    const [user, userLoading] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [lastSubscriptionEnd, lastSubscriptionEndLoading] = useLastSubscriptionEnd();
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const protonConfig = useConfig();
    const isLoading = flagsLoading || userLoading || lastSubscriptionEndLoading || loadingSubscription;
    const isValid = isEligible({ user, protonConfig, subscription, lastSubscriptionEnd }) && isActive;

    return { isValid, config, isLoading };
};

export default useOffer;
