import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { configuration } from './configuration';
import { getIsEligible } from './eligibility';

export const useOffer = (): Operation => {
    const [user, loadingUser] = useUser();
    const [subscription, loadSubscription] = useSubscription();
    const protonConfig = useConfig();
    const [preferredCurrency, loadingCurrency] = useAutomaticCurrency();
    const { isActive, loading: flagsLoading } = useOfferFlags(configuration);
    const userInExperiment = useFeature(FeatureCode.OfferMar26MailPlusRetentionExperiment);

    const isEligible = getIsEligible({
        user,
        subscription,
        protonConfig,
        offerConfig: configuration,
        userInExperiment: userInExperiment?.feature?.Value,
        preferredCurrency,
    });

    return {
        isValid: isEligible && isActive,
        config: configuration,
        isLoading: flagsLoading || loadingUser || loadSubscription || loadingCurrency,
        isEligible,
    };
};
