import { c } from 'ttag';

import type { useRegionalPricing } from '@proton/components/hooks/useRegionalPricing';
import { getIsNewBatchCurrenciesEnabled } from '@proton/components/payments/client-extensions';
import {
    COUPON_CODES,
    CYCLE,
    type Currency,
    PLANS,
    PLAN_NAMES,
    type PaymentMethodStatusExtended,
    getPlanByName,
    getPreferredCurrency,
    isMainCurrency,
} from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getPricePerCycle } from '@proton/shared/lib/helpers/subscription';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import type { Plan, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import type useGetFlag from '@proton/unleash/useGetFlag';

import { PriceCoupon, PriceLine } from './OneDollarPromoComponents';

const ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE = 100;

/**
 * Format a plan in a way that the API can understand
 * @param plan - The plan to format.
 * @returns An object with the plan IDs.
 */
export const getPlanIDsForPlan = (plan: PLANS) => ({ [plan]: 1 });

export const getUserCurrency = async (
    user: UserModel,
    plans: Plan[],
    status: PaymentMethodStatusExtended,
    subscription: Subscription,
    getFlag: ReturnType<typeof useGetFlag>
): Promise<Currency> => {
    const isNewBatchCurrenciesEnabled = getIsNewBatchCurrenciesEnabled(getFlag);
    const currency = getPreferredCurrency({
        user,
        plans,
        status,
        subscription,
        enableNewBatchCurrencies: isNewBatchCurrenciesEnabled,
    });

    return currency;
};

const getUpsellPrice = async ({
    fetchPrice,
    planID,
    currency,
    cycle,
    couponCode,
    defaultPrice,
}: {
    fetchPrice: ReturnType<typeof useRegionalPricing>['fetchPrice'];
    planID: PLANS;
    currency: Currency;
    cycle: CYCLE;
    couponCode: string | undefined;
    defaultPrice: number;
}) => {
    if (isMainCurrency(currency)) {
        return defaultPrice;
    }

    const price = await fetchPrice({
        data: {
            Plans: getPlanIDsForPlan(planID),
            Currency: currency,
            Cycle: cycle,
            CouponCode: couponCode,
        },
        defaultPrice,
        currency,
    });

    return price;
};

interface EligibleUpsellConfigOptions {
    user: UserModel;
    currency: Currency;
    plans: Plan[];
    fetchPrice: ReturnType<typeof useRegionalPricing>['fetchPrice'];
}
export const getMailUpsellConfig: (options: EligibleUpsellConfigOptions) => Promise<{
    planID: PLANS;
    cycle: CYCLE;
    couponCode?: string;
    price: number;
}> = async ({ currency, plans, user, fetchPrice }) => {
    if (user.isFree) {
        const planID = PLANS.MAIL;
        const cycle = CYCLE.MONTHLY;

        // Free users got 1$ promo displayed
        const coupon = COUPON_CODES.TRYMAILPLUS0724;

        const price = await getUpsellPrice({
            fetchPrice,
            planID,
            currency,
            cycle,
            couponCode: coupon,
            defaultPrice: ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE,
        });

        return {
            planID,
            cycle,
            couponCode: coupon,
            price,
        };
    } else {
        const planID = PLANS.BUNDLE;
        const cycle = CYCLE.YEARLY;
        const planName = getPlanByName(plans, getPlanIDsForPlan(planID), currency);
        let price = getPricePerCycle(planName, cycle) ?? 0;

        /**
         * If user has mail plus and is on main currency, we don't need to fetch the price
         * as it's something we get throught the plans Object.
         *
         * Otherwise, we fetch the price from the API.
         */
        if (!user.hasPaidMail) {
            price = await getUpsellPrice({
                fetchPrice,
                planID,
                currency,
                cycle,
                couponCode: undefined,
                defaultPrice: price,
            });
        }

        return {
            planID,
            cycle,
            couponCode: undefined,
            price,
        };
    }
};

export const getMailUpsellsSubmitText = (planID: PLANS, price: number, currency: Currency) => {
    const planName = PLAN_NAMES[planID];
    const priceCoupon = <PriceCoupon key={`price-coupon-${planName}`} currency={currency} amountDue={price} />;

    if (planID === PLANS.MAIL) {
        return c('Action').jt`Get ${planName} for ${priceCoupon}`;
    }

    return getPlanOrAppNameText(planName);
};

export const getMailUpsellsFooterText = (planID: PLANS, price: number, currency: Currency) => {
    const priceCoupon = <PriceCoupon key={`price-coupon-${planID}`} currency={currency} amountDue={price} />;
    const priceLine = <PriceLine key={`price-line-${planID}`} currency={currency} planPrice={price} />;

    if (planID === PLANS.MAIL) {
        return c('new_plans: Subtext')
            .jt`The discounted price of ${priceCoupon} is valid for the first month. Then it will automatically be renewed at ${priceLine}. You can cancel at any time.`;
    }

    return c('new_plans: Subtext')
        .jt`Unlock all ${BRAND_NAME} premium products and features for just ${priceLine}. Cancel anytime.`;
};
