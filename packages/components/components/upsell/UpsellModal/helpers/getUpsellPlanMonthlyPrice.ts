import {
    type COUPON_CODES,
    CYCLE,
    type Currency,
    type PaymentsApi,
    type Plan,
    type PlanIDs,
    getPlanByName,
    isMainCurrency,
} from '@proton/payments';
import { getPricePerCycle } from '@proton/shared/lib/helpers/subscription';

export const getUpsellPlanMonthlyPrice = async ({
    currency,
    cycle,
    paymentsApi,
    planIDs,
    plans,
    coupon,
}: {
    currency: Currency;
    paymentsApi: PaymentsApi;
    plans: Plan[];
    planIDs: PlanIDs;
    cycle: CYCLE.MONTHLY | CYCLE.YEARLY;
    coupon?: COUPON_CODES;
}) => {
    let price = 0;
    if (isMainCurrency(currency)) {
        price = getPricePerCycle(getPlanByName(plans, planIDs, currency), cycle) || 0;
    } else {
        const result = await paymentsApi.checkWithAutomaticVersion({
            Plans: planIDs,
            Currency: currency,
            Cycle: cycle,
            CouponCode: coupon,
        });
        price = result.AmountDue;
    }

    return cycle === CYCLE.MONTHLY ? price : price / 12;
};
