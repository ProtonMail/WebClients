import { usePreviousSubscription } from '@proton/account/previousSubscription/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { anniversary2025MailPlus } from './configuration';
import { getIsEligible } from './eligibility';

export const useAnniversary2025MailPlus = (): Operation => {
    const protonConfig = useConfig();
    const [user, loadingUser] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(anniversary2025MailPlus);
    const [{ previousSubscriptionEndTime }, loadingPreviousSubscription] = usePreviousSubscription();
    const isEligible = getIsEligible({
        user,
        protonConfig,
        previousSubscriptionEndTime,
        subscription,
        offerConfig: anniversary2025MailPlus,
    });

    return {
        isValid: isEligible && isActive,
        config: anniversary2025MailPlus,
        isLoading: flagsLoading || loadingUser || loadingSubscription || loadingPreviousSubscription,
        isEligible,
    };
};
