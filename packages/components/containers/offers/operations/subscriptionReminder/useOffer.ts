import { FeatureCode } from '@proton/components/containers/features';
import useConfig from '@proton/components/hooks/useConfig';
import useFeature from '@proton/components/hooks/useFeature';
import { useUser } from '@proton/components/hooks/useUser';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import config from './configuration';
import getIsEligible from './eligibility';

/**
 * This offer is different than others, it runs all the time and is used to nudge free users
 * Once the account is old enough, we display a spotlight over the upgrade button on the navbar
 **/
const useOffer = (): Operation => {
    const protonConfig = useConfig();
    const [user, loadingUser] = useUser();
    const { isActive, loading: flagsLoading, isVisited } = useOfferFlags(config);
    const { feature: lastReminderDate, loading: lastReminderDateLoading } = useFeature(
        FeatureCode.SubscriptionLastReminderDate
    );

    const isLoading = flagsLoading || loadingUser || lastReminderDateLoading;
    // We use today time if the feature flag is not set to avoid showing the value to all users or unexpected behavior
    const isEligible = getIsEligible({
        user,
        protonConfig,
        lastReminderTimestamp: lastReminderDate?.Value,
        isVisited,
    });

    return { isValid: isEligible && isActive, config, isEligible, isLoading: !!isLoading };
};

export default useOffer;
