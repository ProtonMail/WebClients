import { addMonths } from 'date-fns';
import { c, msgid } from 'ttag';

import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';
import { SubscriptionCheckoutData } from '@proton/shared/lib/helpers/checkout';
import { getPlanFromPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getVPN2024Renew } from '@proton/shared/lib/helpers/renew';
import { getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';
import { Currency, PlanIDs, PlansMap, Subscription } from '@proton/shared/lib/interfaces';

import Price from '../../components/price/Price';
import Time from '../../components/time/Time';
import { getMonths } from './SubscriptionsSection';

export type RenewalNoticeProps = {
    renewCycle: number;
    isCustomBilling?: boolean;
    isScheduledSubscription?: boolean;
    subscription?: Subscription;
};

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

export const getCheckoutRenewNoticeText = ({
    coupon,
    cycle,
    planIDs,
    plansMap,
    currency,
}: {
    cycle: CYCLE;
    planIDs: PlanIDs;
    plansMap: PlansMap;
    checkout: SubscriptionCheckoutData;
    currency: Currency;
    coupon?: string;
}) => {
    if (planIDs[PLANS.VPN2024]) {
        const result = getVPN2024Renew({ planIDs, plansMap, cycle })!;
        const renewCycle = result.renewalLength;
        if (renewCycle === CYCLE.MONTHLY) {
            return c('vpn_2024: renew')
                .t`Subscription auto-renews every 1 month. Your next billing date is in 1 month.`;
        }
        if (renewCycle === CYCLE.THREE) {
            return c('vpn_2024: renew')
                .t`Subscription auto-renews every 3 months. Your next billing date is in 3 months.`;
        }
        const first = c('vpn_2024: renew').ngettext(
            msgid`Your subscription will automatically renew in ${cycle} month.`,
            `Your subscription will automatically renew in ${cycle} months.`,
            cycle
        );
        const renewPrice = (
            <Price key="renewal-price" currency={currency}>
                {result.renewPrice}
            </Price>
        );
        if (renewCycle !== CYCLE.YEARLY) {
            throw new Error('Should never happen');
        }
        const second = c('vpn_2024: renew').jt`You'll then be billed every 12 months at ${renewPrice}.`;
        return [first, ' ', second];
    }
    if (planIDs[PLANS.MAIL] && (coupon === COUPON_CODES.TRYMAILPLUS2024 || coupon === COUPON_CODES.MAILPLUSINTRO)) {
        const renewablePrice = (
            <Price key="renewable-price" currency={currency} suffix={c('Suffix').t`/month`} isDisplayedInSentence>
                {499}
            </Price>
        );

        const unixRenewalTime: number = +addMonths(new Date(), cycle) / 1000;
        const renewTime = (
            <Time format="P" key="auto-renewal-time">
                {unixRenewalTime}
            </Time>
        );

        return c('mailtrial2024: Info')
            .jt`Your subscription will auto-renew on ${renewTime} at ${renewablePrice}, cancel anytime`;
    }
};

export const getRenewalNoticeText = ({
    renewCycle,
    isCustomBilling,
    isScheduledSubscription,
    subscription,
}: RenewalNoticeProps) => {
    let unixRenewalTime: number = +addMonths(new Date(), renewCycle) / 1000;
    if (isCustomBilling && subscription) {
        unixRenewalTime = subscription.PeriodEnd;
    }

    if (isScheduledSubscription && subscription) {
        const periodEndMilliseconds = subscription.PeriodEnd * 1000;
        unixRenewalTime = +addMonths(periodEndMilliseconds, renewCycle) / 1000;
    }

    const renewalTime = (
        <Time format="P" key="auto-renewal-time">
            {unixRenewalTime}
        </Time>
    );

    const nextCycle = getNormalCycleFromCustomCycle(renewCycle);

    let start;
    if (nextCycle === CYCLE.MONTHLY) {
        start = c('Info').t`Subscription auto-renews every month.`;
    }
    if (nextCycle === CYCLE.YEARLY) {
        start = c('Info').t`Subscription auto-renews every 12 months.`;
    }
    if (nextCycle === CYCLE.TWO_YEARS) {
        start = c('Info').t`Subscription auto-renews every 24 months.`;
    }

    return [start, ' ', c('Info').jt`Your next billing date is ${renewalTime}.`];
};
