import { useEligibleTrials } from '@proton/account/eligibleTrials/hooks';
import type { PLANS } from '@proton/payments/core/constants';

import { getReferralIsTrialForPlan } from './referralIsTrial';
import { useIsVPNReferralWithoutTrialVariantB } from './useIsVPNPlanWithoutTrialVariant';

export const useShouldStartTrial = (plan: PLANS) => {
    const { eligibleTrials } = useEligibleTrials();
    const isVariantB = useIsVPNReferralWithoutTrialVariantB();

    return getReferralIsTrialForPlan({ plan, eligibleTrials, isVariantB });
};
