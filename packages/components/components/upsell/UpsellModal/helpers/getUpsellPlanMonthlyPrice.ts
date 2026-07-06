import { getCheckoutUi } from '@proton/payments/core/checkout';
import { type COUPON_CODES, CYCLE } from '@proton/payments/core/constants';
import { isMainCurrency } from '@proton/payments/core/currencies';
import type { Currency, PaymentsApi, PlanIDs } from '@proton/payments/core/interface';
import type { Plan } from '@proton/payments/core/plan/interface';
import { getPricePerCycle } from '@proton/payments/core/price-helpers';
import { getPlanByName, getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';

interface UpsellPlanMonthlyPriceParams {
    currency: Currency;
    paymentsApi: PaymentsApi;
    plans: Plan[];
    planIDs: PlanIDs;
    cycle: CYCLE.MONTHLY | CYCLE.YEARLY;
    coupon?: COUPON_CODES;
}

export const getUpsellPlanMonthlyPrice = async (
    data: UpsellPlanMonthlyPriceParams
): Promise<{
    couponPrice: number;
    regularPrice: number;
}> => {
    let price = 0;
    let regularPrice = 0;

    if (isMainCurrency(data.currency)) {
        price = getPricePerCycle(getPlanByName(data.plans, data.planIDs, data.currency), data.cycle) || 0;
        regularPrice = price;
    } else {
        const checkResult = await data.paymentsApi.checkSubscription({
            Plans: data.planIDs,
            Currency: data.currency,
            Cycle: data.cycle,
            CouponCode: data.coupon,
        });

        const plansMap = getPlansMap(data.plans, data.currency, false);

        const checkout = getCheckoutUi({
            planIDs: data.planIDs,
            checkResult,
            plansMap,
        });

        price = checkout.withDiscountPerCycle;
        regularPrice = checkout.withoutDiscountPerCycle;
    }

    return {
        couponPrice: data.cycle === CYCLE.MONTHLY ? price : price / 12,
        regularPrice: data.cycle === CYCLE.MONTHLY ? regularPrice : regularPrice / 12,
    };
};
