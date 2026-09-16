import type { MethodsHook } from '@proton/payments-ui/react-extensions/index';
import type { CouponConfigMetadata } from '@proton/payments/core/coupon-config/interface';
import type { PlanIDs } from '@proton/payments/core/interface';
import { isCurrencyRestrictedMethod } from '@proton/payments/core/payment-methods/currencyOverride';
import { isLifetimePlanSelected } from '@proton/payments/core/plan/helpers';
import type { UserModel } from '@proton/shared/lib/interfaces';

export const getDisableCurrencySelector = (
    paymentMethods: MethodsHook,
    user: UserModel,
    planIDs: PlanIDs,
    couponConfig: CouponConfigMetadata | undefined,
    loading: boolean | undefined
) => {
    const hasCurrencyRestrictedMethod = isCurrencyRestrictedMethod(paymentMethods.selectedMethod?.type);
    const isLifetimeWithCredits = user.Credit > 0 && isLifetimePlanSelected(planIDs);

    return hasCurrencyRestrictedMethod || isLifetimeWithCredits || couponConfig?.disableCurrencySelector || loading;
};
