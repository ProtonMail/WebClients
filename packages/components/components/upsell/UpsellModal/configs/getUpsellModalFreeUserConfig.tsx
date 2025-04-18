import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES, isMainCurrency } from '@proton/payments/index';
import { getPlanNameFromIDs } from '@proton/shared/lib/helpers/planIDs';

import { getUpsellPlanMonthlyPrice } from '../helpers/getUpsellPlanMonthlyPrice';
import type { UpsellModalConfigCase } from '../interface';

const ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE = 100;

export const getUpsellModalFreeUserConfig: UpsellModalConfigCase = async (props) => {
    const { currency, paymentsApi, plans } = props;

    // Free users got 1$ promo displayed
    const planIDs = { [PLANS.MAIL]: 1 };
    const cycle = CYCLE.MONTHLY;
    // Free users got 1$ promo displayed
    const coupon = COUPON_CODES.TRYMAILPLUS0724;

    const monthlyPrice = isMainCurrency(currency)
        ? ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE
        : await getUpsellPlanMonthlyPrice({
              currency,
              cycle,
              paymentsApi,
              planIDs,
              plans,
              coupon,
          });

    const footerText = (() => {
        const priceLine = (
            <Price
                key="monthly-price"
                currency={currency}
                suffix={c('specialoffer: Offers').t`/month`}
                isDisplayedInSentence
            >
                {monthlyPrice}
            </Price>
        );

        const priceCoupon = (
            <Price currency={currency} key="monthly-amount">
                {monthlyPrice}
            </Price>
        );

        return c('new_plans: Subtext')
            .jt`The discounted price of ${priceCoupon} is valid for the first month. Then it will automatically be renewed at ${priceLine}. You can cancel at any time.`;
    })();

    const submitText = (() => {
        const planID = getPlanNameFromIDs(planIDs);
        if (!planID) {
            return c('Action').t`Upgrade`;
        }
        const planName = PLAN_NAMES[planID];

        const priceCoupon = (
            <Price currency={currency} key="monthlyAmount">
                {monthlyPrice}
            </Price>
        );

        return c('Action').jt`Get ${planName} for ${priceCoupon}`;
    })();

    return {
        planIDs,
        cycle,
        coupon,
        footerText,
        submitText,
    };
};
