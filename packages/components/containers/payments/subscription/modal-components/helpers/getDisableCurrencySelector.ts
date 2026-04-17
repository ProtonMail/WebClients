import type { MethodsHook } from '@proton/components/payments/react-extensions';
import type { PlanIDs } from '@proton/payments/index';
import { PAYMENT_METHOD_TYPES, isLifetimePlanSelected } from '@proton/payments/index';
import type { UserModel } from '@proton/shared/lib/interfaces';

import type { CouponConfigRendered } from '../../coupon-config/useCouponConfig';

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
