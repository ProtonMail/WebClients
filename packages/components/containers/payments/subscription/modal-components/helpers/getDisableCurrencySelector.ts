import { PLANS } from '@proton/payments/core/constants';
import type { CouponConfigMetadata } from '@proton/payments/core/coupon-config/interface';
import type { PlanIDs } from '@proton/payments/core/interface';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { isLifetimePlanSelected } from '@proton/shared/lib/payments/plan/helpers';

const currencyLockedPlans = [PLANS.PASS_BASIC];

const isDisabledByPlan = (planIDs: PlanIDs, plans: PLANS[]) => plans.some((plan) => !!planIDs[plan]);

export const getDisableCurrencySelector = (
    user: UserModel,
    planIDs: PlanIDs,
    couponConfig: CouponConfigMetadata | undefined,
    loading: boolean | undefined
) => {
    const isLifetimeWithCredits = user.Credit > 0 && isLifetimePlanSelected(planIDs);

    return (
        isLifetimeWithCredits ||
        isDisabledByPlan(planIDs, currencyLockedPlans) ||
        couponConfig?.disableCurrencySelector ||
        loading
    );
};
