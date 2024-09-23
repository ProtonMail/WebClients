import { addMonths } from 'date-fns';
import { c, msgid } from 'ttag';

import Time from '@proton/components/components/time/Time';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';
import type { SubscriptionCheckoutData } from '@proton/shared/lib/helpers/checkout';
import { getPlanFromPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getOptimisticRenewCycleAndPrice } from '@proton/shared/lib/helpers/renew';
import { getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';
import type { Coupon, Currency, PlanIDs, PlansMap, Subscription } from '@proton/shared/lib/interfaces';

import Price from '../../components/price/Price';
import { getMonths } from './SubscriptionsSection';
import type { CheckoutModifiers } from './subscription/useCheckoutModifiers';

export type RenewalNoticeProps = {
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
    const nextCycle = getNormalCycleFromCustomCycle(cycle);
    const plan = getPlanFromPlanIDs(plansMap, planIDs);
    const discountedPrice = (
        <Price key="a" currency={currency}>
            {price}
        </Price>
    );
    const nextPrice = plan ? (
        <Price key="b" currency={currency}>
            {plan?.Pricing[nextCycle] || 0}
        </Price>
    ) : null;

    if (nextCycle === CYCLE.MONTHLY) {
        // translator: The specially discounted price of $8.99 is valid for the first month. Then it will automatically be renewed at $9.99 every month. You can cancel at any time.
        return c('bf2023: renew')
            .jt`The specially discounted price of ${discountedPrice} is valid for the first month. Then it will automatically be renewed at ${nextPrice} every month. You can cancel at any time.`;
    }

    const discountedMonths = ((n: number) => {
        if (n === CYCLE.MONTHLY) {
            // translator: This string is a special case for 1 month billing cycle, together with the string "The specially discounted price of ... is valid for the first 'month' ..."
            return c('bf2023: renew').t`the first month`;
        }
        // translator: The singular is not handled in this string. The month part of the string "The specially discounted price of EUR XX is valid for the first 30 months. Then it will automatically be renewed at the discounted price of EUR XX for 24 months. You can cancel at any time."
        return c('bf2023: renew').ngettext(msgid`${n} month`, `the first ${n} months`, n);
    })(cycle);

    const nextMonths = getMonths(nextCycle);

    // translator: The specially discounted price of EUR XX is valid for the first 30 months. Then it will automatically be renewed at the discounted price of EUR XX for 24 months. You can cancel at any time.
    return c('bf2023: renew')
        .jt`The specially discounted price of ${discountedPrice} is valid for ${discountedMonths}. Then it will automatically be renewed at the discounted price of ${nextPrice} for ${nextMonths}. You can cancel at any time.`;
};

export const getRegularRenewalNoticeText = ({
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

    const start =
        cycle === CYCLE.MONTHLY
            ? c('Info').t`Subscription auto-renews every month.`
            : c('Info').t`Subscription auto-renews every ${cycle} months.`;

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

        const renewPrice = (
            <Price key="renewal-price" currency={currency}>
                {renewAmount}
            </Price>
        );

        const second = c('vpn_2024: renew').jt`You'll then be billed every 12 months at ${renewPrice}.`;

        return [first, ' ', second];
    }
};

const getRenewNoticeTextForLimitedCoupons = ({
    coupon,
    cycle,
    planIDs,
    plansMap,
    currency,
    checkout,
}: {
    cycle: CYCLE;
    planIDs: PlanIDs;
    plansMap: PlansMap;
    currency: Currency;
    coupon: Coupon;
    checkout: SubscriptionCheckoutData;
}) => {
    if (!coupon || !coupon.MaximumRedemptionsPerUser) {
        return;
    }

    const couponRedemptions = coupon.MaximumRedemptionsPerUser;

    const priceWithDiscount = (
        <Price key="price-with-discount" currency={currency}>
            {checkout.withDiscountPerCycle}
        </Price>
    );

    const { renewPrice } = getOptimisticRenewCycleAndPrice({ planIDs, plansMap, cycle, currency });
    const months = getMonths(cycle);

    const price = (
        <Price key="price" currency={currency}>
            {renewPrice}
        </Price>
    );

    if (couponRedemptions === 1) {
        if (cycle === CYCLE.MONTHLY) {
            return c('Payments')
                .jt`The specially discounted price of ${priceWithDiscount} is valid for the first month. Then it will automatically be renewed at ${price} every month. You can cancel at any time.`;
        } else {
            return c('Payments')
                .jt`The specially discounted price of ${priceWithDiscount} is valid for the first ${months}. Then it will automatically be renewed at ${price} for ${months}. You can cancel at any time.`;
        }
    }

    return c('Payments')
        .jt`The specially discounted price of ${priceWithDiscount} is valid for the first ${months}. The coupon is valid for ${couponRedemptions} renewals. Then it will automatically be renewed at ${price} for ${months} months. You can cancel at any time.`;
};

export const getCheckoutRenewNoticeText = ({
    coupon,
    cycle,
    planIDs,
    plansMap,
    currency,
    checkout,
    ...rest
}: {
    cycle: CYCLE;
    planIDs: PlanIDs;
    plansMap: PlansMap;
    checkout: SubscriptionCheckoutData;
    currency: Currency;
    coupon: Coupon;
} & RenewalNoticeProps) => {
    const isSpeciallyRenewedPlan = !!planIDs[PLANS.VPN2024];

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
    });

    if (limitedCouponsNotice) {
        return limitedCouponsNotice;
    }

    return getRegularRenewalNoticeText({
        cycle,
        ...rest,
    });
};
