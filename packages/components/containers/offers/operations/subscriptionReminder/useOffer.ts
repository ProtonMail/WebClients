import { useConfig, useUser } from '@proton/components/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import { Operation } from '../../interface';
import config from './configuration';
import getIsEligible from './eligibility';

/**
 * This offer is different than others, it runs all the time and is used to nudge free users
 * Once the account is old enough, we display a spotlight over the upgrade button on the navbar
 **/
const useOffer = (): Operation => {
    const protonConfig = useConfig();
    const [user, loadingUser] = useUser();
    const { isActive, loading: flagsLoading } = useOfferFlags(config);

    const isLoading = flagsLoading || loadingUser;
    // We use today time if the feature flag is not set to avoid showing the value to all users or unexpected behavior
    const isEligible = getIsEligible({
        user,
        protonConfig,
    });
    const isValid = isEligible && isActive;

    return { isValid, config, isEligible, isLoading };
};

export default useOffer;
