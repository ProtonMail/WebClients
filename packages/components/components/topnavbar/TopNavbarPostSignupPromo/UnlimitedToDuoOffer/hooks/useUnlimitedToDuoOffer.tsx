import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import useFlag from '@proton/unleash/useFlag';

import type { OfferHookReturnValue } from '../../common/helpers/interface';
import { getIsEligible } from '../helpers/eligibility';

export const useUnlimitedToDuoOffer = (): OfferHookReturnValue => {
    const protonConfig = useConfig();
    const [user, userLoading] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const isUnlimitedToDuoPermanentOffer = useFlag('UnlimitedToDuoPermanentOffer');
    const { feature, loading } = useFeature(FeatureCode.HideUnlimitedToDuoPermanentOffer);

    return {
        isEligible:
            isUnlimitedToDuoPermanentOffer &&
            !feature?.Value &&
            getIsEligible({ user, subscription, protonConfig, parentApp }),
        isLoading: userLoading || subscriptionLoading || !!loading,
        openSpotlight: false,
    };
};
