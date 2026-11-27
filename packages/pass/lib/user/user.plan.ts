import { PLANS } from '@proton/payments/core/constants';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/payments/plan/helpers';

import { type PassPlanResponse, PlanType } from '../../types/api/pass';
import { UserPassPlan } from '../../types/api/plan';
import type { MaybeNull } from '../../types/utils';
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

/** Paid consumer plans without Pass Plus features (Mail Plus, Drive Plus...):
 * Pass Plus is not an upgrade for them, the next tier is Proton Unlimited. */
export const shouldUpsellUnlimited = (plan?: MaybeNull<PassPlanResponse>): boolean => {
    if (!plan || getPassPlan(plan) !== UserPassPlan.FREE) return false;
    const name = plan.InternalName as PLANS;
    return Boolean(name) && name !== PLANS.FREE && !getIsB2BAudienceFromPlan(name);
};

/** Pass B2B plans, matched by name too as Pass Essentials is not typed as business.
 * Other B2B plans (Mail Professional...) are excluded: Pass Professional is not their upgrade. */
export const isPassB2BPlan = (plan?: MaybeNull<PassPlanResponse>): boolean =>
    getPassPlan(plan) === UserPassPlan.BUSINESS ||
    plan?.InternalName === PLANS.PASS_PRO ||
    plan?.InternalName === PLANS.PASS_BUSINESS;
