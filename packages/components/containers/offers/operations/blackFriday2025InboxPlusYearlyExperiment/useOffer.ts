import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { blackFriday2025InboxPlusYearlyExperimentConfig } from './configuration';
import getIsEligible from './eligibility';

export const useBlackFriday2025InboxPlusYearlyExperiment = (): Operation => {
    const [user, userLoading] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(blackFriday2025InboxPlusYearlyExperimentConfig);
    const [preferredCurrency, loadingCurrency] = useAutomaticCurrency();
    const userInExperiment = useFeature(FeatureCode.BlackFridayWave2InboxExperiment);
    const protonConfig = useConfig();
    const isLoading = flagsLoading || userLoading || subscriptionLoading || loadingCurrency;
    const isEligible = getIsEligible({
        subscription,
        protonConfig,
        user,
        offerConfig: blackFriday2025InboxPlusYearlyExperimentConfig,
        preferredCurrency,
        userInExperiment: userInExperiment?.feature?.Value,
    });
    const isValid = isEligible && isActive;

    return { isValid, config: blackFriday2025InboxPlusYearlyExperimentConfig, isLoading, isEligible };
};
