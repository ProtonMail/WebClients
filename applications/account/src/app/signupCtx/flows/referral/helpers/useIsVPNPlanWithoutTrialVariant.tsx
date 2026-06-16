import { useEligibleTrials } from '@proton/account/eligibleTrials/hooks';
import type { PLANS } from '@proton/payments/index';
import { useFlag } from '@proton/unleash/useFlag';

export const useIsVPNPlanWithoutTrialVariant = (plan: PLANS) => {
    const isVPNReferralWithoutTrialEnabled = useFlag('VPNReferralWithoutTrial');
    const { eligibleTrials } = useEligibleTrials();

    return isVPNReferralWithoutTrialEnabled && eligibleTrials.creditCardRequiredPlans.includes(plan);
};
