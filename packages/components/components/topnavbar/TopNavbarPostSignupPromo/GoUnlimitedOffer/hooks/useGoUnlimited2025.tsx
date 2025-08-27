import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { useFlag } from '@proton/unleash';

import { type OfferHookReturnValue } from '../../common/interface';
import { getIsEligible } from '../helpers/eligibility';

export const useGoUnlimited2025 = (): OfferHookReturnValue => {
    const protonConfig = useConfig();
    const [user, userLoading] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const isGoUnlimitedOffer2025Enabled = useFlag('GoUnlimitedOffer2025');
    const { feature } = useFeature(FeatureCode.OfferGoUnlimited2025);

    return {
        isEligible:
            isGoUnlimitedOffer2025Enabled &&
            feature?.Value === 0 &&
            getIsEligible({ user, subscription, protonConfig, parentApp }),
        isLoading: userLoading || subscriptionLoading,
        openSpotlight: false,
    };
};
