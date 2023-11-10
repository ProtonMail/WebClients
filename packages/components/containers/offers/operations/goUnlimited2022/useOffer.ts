import { useConfig, useSubscription, useUser } from '@proton/components/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import { Operation } from '../../interface';
import config from './configuration';
import getIsEligible from './eligibility';

const useOffer = (): Operation => {
    const [user, userLoading] = useUser();
    const [subscription, loading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const protonConfig = useConfig();
    const isLoading = flagsLoading || userLoading || loading;
    const isEligible = getIsEligible({ user, subscription, protonConfig }) && isActive;
    const isValid = isEligible && isActive;

    return { isValid, config, isLoading, isEligible };
};

export default useOffer;
