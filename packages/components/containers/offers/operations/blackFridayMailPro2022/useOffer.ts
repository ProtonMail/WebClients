import { useConfig, useOrganization, useSubscription, useUser } from '@proton/components/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import config from './configuration';
import isEligible from './eligibility';

const useOffer = () => {
    const [user, userLoading] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const protonConfig = useConfig();
    const [organization, loadingOrganization] = useOrganization();
    const isLoading = flagsLoading || userLoading || subscriptionLoading || loadingOrganization;
    const isValid = isEligible({ user, organization, subscription, protonConfig }) && isActive;

    return { isValid, config, isLoading };
};

export default useOffer;
