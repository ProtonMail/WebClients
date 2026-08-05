import { useEligibleTrials } from '@proton/account/eligibleTrials/hooks';
import type { PLANS } from '@proton/payments/core/constants';
import { useVariant } from '@proton/unleash/useVariant';

/**
 * A/B test on the referral signup.
 * Flag disabled or variant A: default behaviour (trial).
 * Variant B: no trial for plans requiring a credit card.
 */
export const useIsVPNReferralWithoutTrialVariantB = () => {
    return useVariant('VPNReferralWithoutTrial').name === 'B';
};

export const useIsVPNPlanWithoutTrialVariant = (plan: PLANS) => {
    const isVariantB = useIsVPNReferralWithoutTrialVariantB();
    const { eligibleTrials } = useEligibleTrials();

    return isVariantB && eligibleTrials.creditCardRequiredPlans.includes(plan);
};
