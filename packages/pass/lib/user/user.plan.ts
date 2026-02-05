import { type MaybeNull, type PassPlanResponse, PlanType } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { PLANS } from '@proton/payments/index';

export const getPassPlan = (plan?: MaybeNull<PassPlanResponse>): UserPassPlan => {
    switch (plan?.Type) {
        case PlanType.PLUS:
            return plan.InternalName === PLANS.PASS && plan.TrialEnd && getEpoch() < plan.TrialEnd
                ? UserPassPlan.TRIAL
                : UserPassPlan.PLUS;
        case PlanType.BUSINESS:
            return UserPassPlan.BUSINESS;
        default: {
            return UserPassPlan.FREE;
        }
    }
};
