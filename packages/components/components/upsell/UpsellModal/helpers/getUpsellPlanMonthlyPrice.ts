import {
    type COUPON_CODES,
    CYCLE,
    type Currency,
    type PaymentsApi,
    type Plan,
    type PlanIDs,
    getPlanByName,
    getPlansMap,
    getPricePerCycle,
    isMainCurrency,
} from '@proton/payments';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';

interface UpsellPlanMonthlyPriceParams {
    currency: Currency;
    paymentsApi: PaymentsApi;
    plans: Plan[];
    planIDs: PlanIDs;
    cycle: CYCLE.MONTHLY | CYCLE.YEARLY;
    coupon?: COUPON_CODES;
}

export const getUpsellPlanMonthlyPrice = async (props: UpsellPlanMonthlyPriceParams) => {
    const { currency, cycle, planIDs, plans, coupon, paymentsApi } = props;
    let price = 0;
    if (isMainCurrency(currency)) {
        price = getPricePerCycle(getPlanByName(plans, planIDs, currency), cycle) || 0;
    } else {
        const checkResult = await paymentsApi.checkWithAutomaticVersion({
            Plans: planIDs,
            Currency: currency,
            Cycle: cycle,
            CouponCode: coupon,
        });

        const plansMap = getPlansMap(plans, currency, false);

        const checkout = getCheckout({
            planIDs,
            checkResult,
            plansMap,
        });

        price = checkout.withDiscountPerCycle;
    }

    return cycle === CYCLE.MONTHLY ? price : price / 12;
};
