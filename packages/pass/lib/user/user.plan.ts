import { type MaybeNull, type PassPlanResponse, PlanType } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { getEpoch } from '@proton/pass/utils/time/epoch';

export const getPassPlan = (plan?: MaybeNull<PassPlanResponse>): UserPassPlan => {
    switch (plan?.Type) {
        case PlanType.plus:
            return plan.TrialEnd && getEpoch() < plan.TrialEnd ? UserPassPlan.TRIAL : UserPassPlan.PLUS;
        case PlanType.business:
            return UserPassPlan.BUSINESS;
        default: {
            return UserPassPlan.FREE;
        }
    }
};
