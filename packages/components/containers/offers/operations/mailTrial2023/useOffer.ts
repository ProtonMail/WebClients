import { useSubscription } from '@proton/components/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import { Operation } from '../../interface';
import config from './configuration';
import isEligible from './eligibility';

const useOffer = (): Operation => {
    const [subscription, loadingSubscription] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const isLoading = loadingSubscription || flagsLoading;
    const isValid = isEligible({ subscription }) && isActive;

    return { isValid, config, isLoading };
};

export default useOffer;
