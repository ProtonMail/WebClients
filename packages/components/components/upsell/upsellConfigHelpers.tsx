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
    type Plan,
    type Subscription,
    getPlanByName,
    getPreferredCurrency,
    isMainCurrency,
} from '@proton/payments';
import { BRAND_NAME, MAIL_UPSELL_PATHS, SHARED_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { getPricePerCycle } from '@proton/shared/lib/helpers/subscription';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import type { UserModel } from '@proton/shared/lib/interfaces';
import type useGetFlag from '@proton/unleash/useGetFlag';

import Price from '../price/Price';

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
    coupon,
    defaultPrice,
}: {
    fetchPrice: ReturnType<typeof useRegionalPricing>['fetchPrice'];
    planID: PLANS;
    currency: Currency;
    cycle: CYCLE;
    coupon: string | undefined;
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
            CouponCode: coupon,
        },
        defaultPrice,
        currency,
    });

    return price;
};

interface MailUpsellConfigParams {
    user: UserModel;
    currency: Currency;
    plans: Plan[];
    fetchPrice: ReturnType<typeof useRegionalPricing>['fetchPrice'];
    upsellRef?: string;
}

interface MailUpsellConfig {
    planID: PLANS;
    cycle: CYCLE;
    coupon?: string;
    monthlyPrice: number;
}

/**
 * @throws if no prices found
 */
export const getMailUpsellConfig: (options: MailUpsellConfigParams) => Promise<MailUpsellConfig> = async ({
    currency,
    plans,
    user,
    fetchPrice,
    upsellRef,
}) => {
    const isSentinelUpsell = [SHARED_UPSELL_PATHS.SENTINEL, MAIL_UPSELL_PATHS.PROTON_SENTINEL].some((path) =>
        upsellRef?.includes(path)
    );
    const isComposerAssistantUpsell = upsellRef?.includes(MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER);

    let planID = PLANS.BUNDLE;
    let cycle = CYCLE.YEARLY;
    let coupon = undefined;
    let canFetchPrice = true;

    const planName = getPlanByName(plans, getPlanIDsForPlan(planID), currency);
    let price = getPricePerCycle(planName, cycle) || 0;

    if (isComposerAssistantUpsell) {
        planID = PLANS.DUO;
        cycle = CYCLE.YEARLY;
    } else if (user.isFree && !isSentinelUpsell) {
        planID = PLANS.MAIL;
        cycle = CYCLE.MONTHLY;

        // Free users got 1$ promo displayed
        coupon = COUPON_CODES.TRYMAILPLUS0724;
        price = ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE;
    } else {
        // TODO confirm this part now that components are better isolated.

        /**
         * If user has mail plus we don't need to fetch the price
         * as it's something we get throught the plans Object.
         * Otherwise, we fetch the price from the API.
         */
        canFetchPrice = !user.hasPaidMail;
    }

    if (canFetchPrice) {
        const fetchedPrice = await getUpsellPrice({
            coupon,
            currency,
            cycle,
            defaultPrice: price,
            fetchPrice,
            planID,
        });
        price = fetchedPrice;
    }

    if (!price) {
        throw new Error('Price not found');
    }

    const monthlyPrice = cycle === CYCLE.MONTHLY ? price : price / 12;

    return {
        coupon,
        cycle,
        planID,
        monthlyPrice,
    };
};

export const getMailUpsellsSubmitText = (
    planID: PLANS,
    price: number,
    currency: Currency,
    coupon: string | undefined
) => {
    const planName = PLAN_NAMES[planID];
    const priceCoupon = (
        <Price currency={currency} key={`${planID}-monthly-amount`}>
            {price}
        </Price>
    );

    if (coupon) {
        return c('Action').jt`Get ${planName} for ${priceCoupon}`;
    }

    return getPlanOrAppNameText(planName);
};

export const getMailUpsellsFooterText = (
    planID: PLANS,
    price: number,
    currency: Currency,
    coupon: string | undefined
) => {
    const priceLine = (
        <Price
            key={`monthly-price-${planID}`}
            currency={currency}
            suffix={c('specialoffer: Offers').t`/month`}
            isDisplayedInSentence
        >
            {price}
        </Price>
    );

    if (coupon) {
        const priceCoupon = (
            <Price currency={currency} key={`${planID}-monthly-amount`}>
                {price}
            </Price>
        );

        return c('new_plans: Subtext')
            .jt`The discounted price of ${priceCoupon} is valid for the first month. Then it will automatically be renewed at ${priceLine}. You can cancel at any time.`;
    }

    if (planID === PLANS.BUNDLE) {
        return c('new_plans: Subtext')
            .jt`Unlock all ${BRAND_NAME} premium products and features for just ${priceLine}. Cancel anytime.`;
    }

    if (price) {
        return c('new_plans: Subtext').jt`Starting from ${priceLine}`;
    }

    return null;
};
