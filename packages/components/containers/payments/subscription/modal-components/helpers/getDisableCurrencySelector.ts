import type { MethodsHook } from '@proton/components/payments/react-extensions';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
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
    const isSepaDirectDebit = paymentMethods.selectedMethod?.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT;
    const isLifetimeWithCredits = user.Credit > 0 && isLifetimePlanSelected(planIDs);

    return isSepaDirectDebit || isLifetimeWithCredits || couponConfig?.disableCurrencySelector || loading;
};
