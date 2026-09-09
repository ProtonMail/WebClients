import type { EligibleTrials } from '@proton/account/eligibleTrials';
import type { PLANS } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import { getPlanNameFromIDs } from '@proton/payments/core/plan/helpers';

/**
 * Whether the referral signup will create the plan as a trial.
 *
 * Variant B of the `VPNReferralWithoutTrial` A/B test replaces the trial with a full purchase for the plans the API
 * marks as requiring a credit card, so both the eligibility response and the variant are needed to answer this.
 */
export const getReferralIsTrialForPlan = ({
    plan,
    eligibleTrials,
    isVariantB,
}: {
    plan: PLANS;
    eligibleTrials: EligibleTrials;
    isVariantB: boolean;
}) => {
    if (!eligibleTrials.trialPlans.includes(plan)) {
        return false;
    }

    return !(isVariantB && eligibleTrials.creditCardRequiredPlans.includes(plan));
};

/**
 * Same answer as {@link getReferralIsTrialForPlan}, for the plan IDs the payments context reports events with.
 */
export const getReferralIsTrial = ({
    planIDs,
    eligibleTrials,
    isVariantB,
}: {
    planIDs: PlanIDs;
    eligibleTrials: EligibleTrials;
    isVariantB: boolean;
}) => {
    const plan = getPlanNameFromIDs(planIDs);
    if (!plan) {
        return false;
    }

    return getReferralIsTrialForPlan({ plan, eligibleTrials, isVariantB });
};
