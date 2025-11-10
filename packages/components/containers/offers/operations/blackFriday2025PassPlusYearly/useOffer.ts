import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { blackFriday2025PassPlusYearlyConfig } from './configuration';
import getIsEligible from './eligibility';

export const useBlackFriday2025PassPlusYearly = (): Operation => {
    const [user, userLoading] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(blackFriday2025PassPlusYearlyConfig);
    const [preferredCurrency, loadingCurrency] = useAutomaticCurrency();
    const userInInboxExperiment = useFeature(FeatureCode.BlackFridayWave2InboxExperiment);
    const userInVPNExperiment = useFeature(FeatureCode.BlackFridayWave2VPNExperiment);
    const userInExperiment = userInInboxExperiment?.feature?.Value === 1 || userInVPNExperiment?.feature?.Value === 1;
    const protonConfig = useConfig();
    const isLoading = flagsLoading || userLoading || subscriptionLoading || loadingCurrency;
    const isEligible = getIsEligible({
        subscription,
        protonConfig,
        user,
        offerConfig: blackFriday2025PassPlusYearlyConfig,
        preferredCurrency,
        userInExperiment,
    });
    const isValid = isEligible && isActive;

    return { isValid, config: blackFriday2025PassPlusYearlyConfig, isLoading, isEligible };
};
