import { useSubscription } from '@proton/account/subscription/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import type { Operation } from '../../interface';
import { mailTrial2023Config } from './configuration';
import { getIsEligible } from './eligibility';

export const useMailTrial2023 = (): Operation => {
    const [subscription, loadingSubscription] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(mailTrial2023Config);
    const isLoading = flagsLoading || loadingSubscription;
    const isEligible = getIsEligible({ subscription });
    const isValid = isEligible && isActive;

    return { isValid, config: mailTrial2023Config, isLoading, isEligible };
};
