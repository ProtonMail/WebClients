import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import useFlag from '@proton/unleash/useFlag';

import type { OfferHookReturnValue } from '../../common/interface';

export const useUnlimitedToDuoOffer = (): OfferHookReturnValue => {
    const [, userLoading] = useUser();
    const [, subscriptionLoading] = useSubscription();
    const isUnlimitedToDuoPermanentOffer = useFlag('UnlimitedToDuoPermanentOffer');
    const { feature, loading } = useFeature(FeatureCode.HideUnlimitedToDuoPermanentOffer);

    // TODO: add the eligibility required from the user
    return {
        isEligible: isUnlimitedToDuoPermanentOffer && !feature?.Value,
        isLoading: userLoading || subscriptionLoading || !!loading,
        openSpotlight: false,
    };
};
