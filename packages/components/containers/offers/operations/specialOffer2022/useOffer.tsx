import { useConfig, useSubscription, useUser } from '@proton/components/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import { Operation } from '../../interface';
import config from './configuration';
import isEligible from './eligibility';

const useOffer = (): Operation => {
    const [user, userLoading] = useUser();
    const [subscription, loading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const protonConfig = useConfig();
    const isLoading = flagsLoading || userLoading || loading;
    const isValid = isEligible({ user, subscription, protonConfig }) && isActive;

    return { isValid, config, isLoading };
};

export default useOffer;
