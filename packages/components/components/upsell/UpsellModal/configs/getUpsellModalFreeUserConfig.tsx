import { c } from 'ttag';

import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { isMainCurrency } from '@proton/payments/core/currencies';
import { getPlanNameFromIDs } from '@proton/payments/core/plan/helpers';

import Price from '../../../price/Price';
import { getUpsellPlanMonthlyPrice } from '../helpers/getUpsellPlanMonthlyPrice';
import type { UpsellModalConfigCase } from '../interface';

export const ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE = 100;

export const getUpsellModalFreeUserConfig: UpsellModalConfigCase = async (props) => {
    const { currency, paymentsApi, plans, hasHadSubscription } = props;

    const planIDs = { [PLANS.MAIL]: 1 };
    const cycle = CYCLE.MONTHLY;
    // The 1$ promo is an intro offer, so it can only be redeemed by users who never subscribed before
    const coupon = hasHadSubscription ? undefined : COUPON_CODES.TRYMAILPLUS0724;

    const offerMonthlyPrice = await getUpsellPlanMonthlyPrice({
        currency,
        cycle,
        paymentsApi,
        planIDs,
        plans,
        coupon,
    });

    // In order to avoid fetching coupon price for 1$ promo we hardcode it
    // Alternatively: We could compute discounted price by doing `monthly price - discountedPrice`
    // This way no need to hardcode anything.
    const couponMonthlyPrice = isMainCurrency(currency)
        ? ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE
        : offerMonthlyPrice.couponPrice;

    const displayedPrice = coupon ? couponMonthlyPrice : offerMonthlyPrice.regularPrice;

    const offerPrice = (
        <Price currency={currency} key="offerPrice">
            {displayedPrice}
        </Price>
    );

    const footerText = (() => {
        if (!coupon) {
            return;
        }
        const priceLine = (
            <Price
                key="monthly-price"
                currency={currency}
                suffix={c('specialoffer: Offers').t`/month`}
                isDisplayedInSentence
            >
                {offerMonthlyPrice.regularPrice}
            </Price>
        );

        const priceCoupon = (
            <Price currency={currency} key="monthly-amount">
                {couponMonthlyPrice}
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
                {displayedPrice}
            </Price>
        );

        return c('Action').jt`Get ${planName} for ${priceCoupon}`;
    })();

    return {
        planIDs,
        cycle,
        coupon,
        footerText,
        offerPrice,
        submitText,
    };
};
