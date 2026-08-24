import { PLANS } from '@proton/payments/core/constants';

import { type MaybeNull, type PassPlanResponse, PlanType } from '../../types';
import { UserPassPlan } from '../../types/api/plan';
import { getEpoch } from '../../utils/time/epoch';

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
