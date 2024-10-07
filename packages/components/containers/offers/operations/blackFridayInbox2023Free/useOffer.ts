import { useUser } from '@proton/account/user/hooks';
import { useSubscription } from '@proton/components/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import useLastSubscriptionEnd from '@proton/components/hooks/useLastSubscriptionEnd';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import config from './configuration';
import getIsEligible from './eligibility';

const useOffer = (): Operation => {
    const [user, userLoading] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const [lastSubscriptionEnd, lastSubscriptionEndLoading] = useLastSubscriptionEnd();
    const protonConfig = useConfig();
    const isLoading = flagsLoading || userLoading || subscriptionLoading || lastSubscriptionEndLoading;
    const isEligible = getIsEligible({ subscription, protonConfig, user, lastSubscriptionEnd });
    const isValid = isEligible && isActive;

    return { isValid, config, isLoading, isEligible };
};

export default useOffer;
