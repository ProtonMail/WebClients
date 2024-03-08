import { useConfig, useUser } from '@proton/components/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import { Operation } from '../../interface';
import config from './configuration';
import getIsEligible from './eligibility';

const useOffer = (): Operation => {
    const [user, loadingUser] = useUser();
    const protonConfig = useConfig();
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const isLoading = flagsLoading || loadingUser;
    const isEligible = getIsEligible({ user, protonConfig });
    const isValid = isEligible && isActive;

    return { isValid, config, isLoading, isEligible };
};

export default useOffer;
