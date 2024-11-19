import { type ReactNode } from 'react';

import { addMonths } from 'date-fns';
import { c, msgid } from 'ttag';

import { getSimplePriceString } from '@proton/components/components/price/helper';
import Time from '@proton/components/components/time/Time';
import { type Currency, PLANS, type PlanIDs } from '@proton/payments';
import { CYCLE, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { type SubscriptionCheckoutData, getCheckout } from '@proton/shared/lib/helpers/checkout';
import { getPlanNameFromIDs, isLifetimePlanSelected } from '@proton/shared/lib/helpers/planIDs';
import { getOptimisticRenewCycleAndPrice, isSpecialRenewPlan } from '@proton/shared/lib/helpers/renew';
import {
    getHas2024OfferCoupon,
    getPlanName,
    getPlanTitle,
    isLifetimePlan,
} from '@proton/shared/lib/helpers/subscription';
import type { Coupon, PlansMap, Subscription, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

import type { CheckoutModifiers } from './subscription/useCheckoutModifiers';

type RenewalNoticeProps = {
    cycle: number;
    subscription?: Subscription;
} & Partial<CheckoutModifiers>;

export const getBlackFridayRenewalNoticeText = ({
    price,
    cycle,
    plansMap,
    planIDs,
    currency,
}: {
    price: number;
    cycle: CYCLE;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    currency: Currency;
}) => {
    const { renewPrice: renewAmount, renewalLength } = getOptimisticRenewCycleAndPrice({
        planIDs,
        plansMap,
        cycle,
        currency,
    });

    const discountedPrice = getSimplePriceString(currency, price);
    const nextPrice = getSimplePriceString(currency, renewAmount);

    if (renewalLength === CYCLE.MONTHLY) {
        // translator: The specially discounted price of US$8.99 is valid for the first month. Then it will automatically be renewed at US$9.99 every month. You can cancel at any time.
        return c('bf2023: renew')
            .t`The specially discounted price of ${discountedPrice} is valid for the first month. Then it will automatically be renewed at ${nextPrice} every month. You can cancel at any time.`;
    }

    // translator: Note - renewalLength is greater than 1. Full string is "The specially discounted price of US$8.99 is valid for the first 12 months. Then it will automatically be renewed at US$9.99 for 12 months. You can cancel at any time."
    return c('bf2023: renew')
        .t`The specially discounted price of ${discountedPrice} is valid for the first ${cycle} months. Then it will automatically be renewed at the discounted price of ${nextPrice} for ${renewalLength} months. You can cancel at any time.`;
};

const getRegularRenewalNoticeText = ({
    cycle,
    isCustomBilling,
    isScheduledSubscription,
    isAddonDowngrade,
    subscription,
}: RenewalNoticeProps) => {
    let unixRenewalTime: number = +addMonths(new Date(), cycle) / 1000;
    // custom billings are renewed at the end of the current subscription.
    // addon downgrades are more tricky. On the first glance they behave like scheduled subscriptions,
    // because they indeed create an upcoming subscription. But when subscription/check returns addon
    // downgrade then user pays nothing now, and the scheduled subscription will still be created.
    // The payment happens when the upcoming subscription becomes the current one. So the next billing date is still
    // the end of the current subscription.
    if ((isCustomBilling || isAddonDowngrade) && subscription) {
        unixRenewalTime = subscription.PeriodEnd;
    }

    if (isScheduledSubscription && subscription) {
        const periodEndMilliseconds = subscription.PeriodEnd * 1000;
        unixRenewalTime = +addMonths(periodEndMilliseconds, cycle) / 1000;
    }

    const renewalTime = (
        <Time format="P" key="auto-renewal-time">
            {unixRenewalTime}
        </Time>
    );

    const start = c('Info').ngettext(
        msgid`Subscription auto-renews every month.`,
        `Subscription auto-renews every ${cycle} months.`,
        cycle
    );

    return [start, ' ', c('Info').jt`Your next billing date is ${renewalTime}.`];
};

const getSpecialLengthRenewNoticeText = ({
    cycle,
    planIDs,
    plansMap,
    currency,
}: {
    cycle: CYCLE;
    planIDs: PlanIDs;
    plansMap: PlansMap;
    currency: Currency;
}) => {
    const { renewPrice: renewAmount, renewalLength } = getOptimisticRenewCycleAndPrice({
        planIDs,
        plansMap,
        cycle,
        currency,
    });

    if (renewalLength === CYCLE.YEARLY) {
        const first = c('vpn_2024: renew').ngettext(
            msgid`Your subscription will automatically renew in ${cycle} month.`,
            `Your subscription will automatically renew in ${cycle} months.`,
            cycle
        );

        const renewPrice = getSimplePriceString(currency, renewAmount);

        const second = c('vpn_2024: renew').jt`You'll then be billed every 12 months at ${renewPrice}.`;

        return [first, ' ', second];
    }
};

const getRenewNoticeTextForLimitedCoupons = ({
    coupon,
    cycle: subscriptionLength, // Elaborate name of the variable to help the translators
    planIDs,
    plansMap,
    currency,
    checkout,
    short,
}: {
    cycle: CYCLE;
    planIDs: PlanIDs;
    plansMap: PlansMap;
    currency: Currency;
    coupon: Coupon;
    checkout: SubscriptionCheckoutData;
    short?: boolean;
}) => {
    if (!coupon || !coupon.MaximumRedemptionsPerUser) {
        return;
    }

    const couponRedemptions = coupon.MaximumRedemptionsPerUser;

    const priceWithDiscount = getSimplePriceString(currency, checkout.withDiscountPerCycle);

    const renewPrice = getSimplePriceString(
        currency,
        getOptimisticRenewCycleAndPrice({ planIDs, plansMap, cycle: subscriptionLength, currency }).renewPrice
    );

    if (couponRedemptions === 1) {
        if (short) {
            return c('Payments').jt`Renews at ${renewPrice}, cancel anytime.`;
        }

        const subscriptionLengthCopy = subscriptionLength;

        return c('Payments').ngettext(
            msgid`The specially discounted price of ${priceWithDiscount} is valid for the first month. Then it will automatically be renewed at ${renewPrice} every month. You can cancel at any time.`,
            msgid`The specially discounted price of ${priceWithDiscount} is valid for the first ${subscriptionLength} months. Then it will automatically be renewed at ${renewPrice} for ${subscriptionLengthCopy} months. You can cancel at any time.`,
            subscriptionLength
        );
    }

    // translator: couponRedemptions is greater than 1 in this case
    return c('Payments').ngettext(
        msgid`The specially discounted price of ${priceWithDiscount} is valid for the first month. The coupon is valid for ${couponRedemptions} renewals. Then it will automatically be renewed at ${renewPrice} for ${subscriptionLength} months. You can cancel at any time.`,
        msgid`The specially discounted price of ${priceWithDiscount} is valid for the first ${subscriptionLength} months. The coupon is valid for ${couponRedemptions} renewals. Then it will automatically be renewed at ${renewPrice} for ${subscriptionLength} months. You can cancel at any time.`,
        subscriptionLength
    );
};

export const getPassLifetimeRenewNoticeText = ({ subscription }: { subscription?: Subscription }) => {
    const planName = getPlanName(subscription);
    if (!planName || planName === PLANS.FREE) {
        return c('Info')
            .t`${PASS_SHORT_APP_NAME} lifetime deal has no renewal price, it's a one-time payment for lifetime access to ${PASS_SHORT_APP_NAME}.`;
    }

    if (planName === PLANS.PASS) {
        return c('Info')
            .t`Your ${PASS_SHORT_APP_NAME} Plus subscription will be replaced with ${PASS_SHORT_APP_NAME} Lifetime. The remaining balance of your subscription will be added to your account. ${PASS_SHORT_APP_NAME} lifetime deal has no renewal price, it's a one-time payment for lifetime access to ${PASS_SHORT_APP_NAME}.`;
    }

    const planTitle = getPlanTitle(subscription);
    return c('Info')
        .t`${PASS_SHORT_APP_NAME} lifetime deal has no renewal price, it's a one-time payment for lifetime access to ${PASS_SHORT_APP_NAME}. Your ${planTitle} subscription renewal price and date remain unchanged.`;
};

export const getLifetimeRenewNoticeText = ({
    subscription,
    planIDs,
}: {
    planIDs: PlanIDs;
    subscription?: Subscription;
}) => {
    const planName = getPlanNameFromIDs(planIDs);

    if (isLifetimePlan(planName)) {
        return getPassLifetimeRenewNoticeText({ subscription });
    }
};

export const getCheckoutRenewNoticeText = ({
    coupon,
    cycle,
    planIDs,
    plansMap,
    currency,
    checkout,
    short,
    ...renewalNoticeProps
}: {
    coupon: Coupon;
    cycle: CYCLE;
    planIDs: PlanIDs;
    plansMap: PlansMap;
    currency: Currency;
    checkout: SubscriptionCheckoutData;
    short?: boolean;
} & RenewalNoticeProps): ReactNode => {
    if (isLifetimePlanSelected(planIDs)) {
        return getLifetimeRenewNoticeText({ ...renewalNoticeProps, planIDs });
    }

    if (getHas2024OfferCoupon(coupon?.Code)) {
        return getBlackFridayRenewalNoticeText({
            currency,
            planIDs,
            plansMap,
            cycle,
            price: checkout.withDiscountPerCycle,
        });
    }

    const isSpeciallyRenewedPlan = isSpecialRenewPlan(planIDs);
    if (isSpeciallyRenewedPlan) {
        const specialLengthRenewNotice = getSpecialLengthRenewNoticeText({
            cycle,
            planIDs,
            plansMap,
            currency,
        });

        if (specialLengthRenewNotice) {
            return specialLengthRenewNotice;
        }
    }

    const limitedCouponsNotice = getRenewNoticeTextForLimitedCoupons({
        coupon,
        cycle,
        planIDs,
        plansMap,
        currency,
        checkout,
        short,
    });

    if (limitedCouponsNotice) {
        return limitedCouponsNotice;
    }

    return getRegularRenewalNoticeText({
        cycle,
        ...renewalNoticeProps,
    });
};

export const getCheckoutRenewNoticeTextFromCheckResult = ({
    checkResult,
    plansMap,
    planIDs,
    short,
}: {
    checkResult: SubscriptionCheckResponse;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    short?: boolean;
}) => {
    return getCheckoutRenewNoticeText({
        plansMap,
        planIDs,
        cycle: checkResult.Cycle,
        checkout: getCheckout({
            planIDs,
            checkResult,
            plansMap,
        }),
        currency: checkResult.Currency,
        coupon: checkResult.Coupon,
        short,
    });
};
