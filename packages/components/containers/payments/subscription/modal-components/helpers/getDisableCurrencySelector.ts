import type { MethodsHook } from '@proton/components/payments/react-extensions';
import type { PlanIDs } from '@proton/payments/core/interface';
import { isCurrencyRestrictedMethod } from '@proton/payments/core/payment-methods/useCurrencyOverride';
import { isLifetimePlanSelected } from '@proton/payments/core/plan/helpers';
import type { CouponConfigRendered } from '@proton/payments/ui/coupon-config/useCouponConfig';
import type { UserModel } from '@proton/shared/lib/interfaces';

export const getDisableCurrencySelector = (
    paymentMethods: MethodsHook,
    user: UserModel,
    planIDs: PlanIDs,
    couponConfig: CouponConfigRendered | undefined,
    loading: boolean | undefined
) => {
    const hasCurrencyRestrictedMethod = isCurrencyRestrictedMethod(paymentMethods.selectedMethod?.type);
    const isLifetimeWithCredits = user.Credit > 0 && isLifetimePlanSelected(planIDs);

    return hasCurrencyRestrictedMethod || isLifetimeWithCredits || couponConfig?.disableCurrencySelector || loading;
};
