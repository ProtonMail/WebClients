import { useEligibleTrials } from '@proton/account/eligibleTrials/hooks';
import type { PLANS } from '@proton/payments/index';

import { useIsVPNPlanWithoutTrialVariant } from './useIsVPNPlanWithoutTrialVariant';

export const useShouldStartTrial = (plan: PLANS) => {
    const { eligibleTrials } = useEligibleTrials();

    const isVPNPlanWithoutTrial = useIsVPNPlanWithoutTrialVariant(plan);
    return eligibleTrials.trialPlans.includes(plan) && !isVPNPlanWithoutTrial;
};
