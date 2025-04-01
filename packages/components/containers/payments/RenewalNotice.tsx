import { type ReactNode } from 'react';

import { addMonths } from 'date-fns';
import { c, msgid } from 'ttag';

import { Href } from '@proton/atoms/index';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getReadableTime } from '@proton/components/components/time/Time';
import type { CheckoutModifiers } from '@proton/payments';
import {
    CYCLE,
    type Currency,
    PLANS,
    type PlanIDs,
    type PlansMap,
    type Subscription,
    getCheckoutModifiers,
} from '@proton/payments';
import { type APP_NAMES, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import {
    type RequiredCheckResponse,
    type SubscriptionCheckoutData,
    getCheckout,
} from '@proton/shared/lib/helpers/checkout';
import { getPlanNameFromIDs, isLifetimePlanSelected } from '@proton/shared/lib/helpers/planIDs';
import { getOptimisticRenewCycleAndPrice, isSpecialRenewPlan } from '@proton/shared/lib/helpers/renew';
import { getPlanName, getPlanTitle, isLifetimePlan } from '@proton/shared/lib/helpers/subscription';
import { getTermsURL } from '@proton/shared/lib/helpers/url';
import type { Coupon } from '@proton/shared/lib/interfaces';

type RenewalNoticeProps = {
    cycle: CYCLE;
    subscription?: Subscription;
} & Partial<CheckoutModifiers>;

const isBundleB2CPlan = (planOrPlanIDs: PLANS | PlanIDs | undefined): boolean => {
    if (!planOrPlanIDs) {
        return false;
    }

    const plan = typeof planOrPlanIDs === 'string' ? planOrPlanIDs : getPlanNameFromIDs(planOrPlanIDs);
    if (!plan) {
        return false;
    }

    return [PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY].includes(plan);
};

const getRenewalPricingSubjectToChangeText = (
    planOrPlanIDs: PLANS | PlanIDs | undefined,
    cycle: CYCLE,
    app: APP_NAMES
): string | string[] | null => {
    if (!isBundleB2CPlan(planOrPlanIDs) || cycle <= CYCLE.YEARLY) {
        return null;
    }

    const termsAndConditionsUrl = getTermsURL(app);
    const termsAndConditionsLink = (
        <Href className="color-weak hover:color-weak" href={termsAndConditionsUrl}>
            {c('Payments').t`terms & conditions`}
        </Href>
    );

    return c('Payments').jt`Renewal pricing subject to change according to ${termsAndConditionsLink}.`;
};

const appendTermsAndConditionsLink = (
    text: (string | string[])[],
    planOrPlanIDs: PLANS | PlanIDs | undefined,
    cycle: CYCLE,
    app: APP_NAMES
): (string | string[])[] => {
    const link = getRenewalPricingSubjectToChangeText(planOrPlanIDs, cycle, app);
    if (!link) {
        return text;
    }

    return [...text, ' ', link];
};

const getRegularRenewalNoticeText = ({
    cycle,
    isCustomBilling,
    isScheduledChargedImmediately,
    isScheduledChargedLater,
    subscription,
    planIDs,
    renewAmount,
    renewCycle,
    currency,
    app,
}: RenewalNoticeProps & {
    planIDs: PlanIDs;
    renewAmount: number | null;
    renewCycle: CYCLE | null;
    currency: Currency;
    app: APP_NAMES;
}) => {
    let unixRenewalTime: number = +addMonths(new Date(), cycle) / 1000;
    // custom billings are renewed at the end of the current subscription.
    // addon downgrades are more tricky. On the first glance they behave like scheduled subscriptions,
    // because they indeed create an upcoming subscription. But when subscription/check returns addon
    // downgrade then user pays nothing now, and the scheduled subscription will still be created.
    // The payment happens when the upcoming subscription becomes the current one. So the next billing date is still
    // the end of the current subscription.
    if ((isCustomBilling || isScheduledChargedLater) && subscription) {
        unixRenewalTime = subscription.PeriodEnd;
    } else if (isScheduledChargedImmediately && subscription) {
        const periodEndMilliseconds = subscription.PeriodEnd * 1000;
        unixRenewalTime = +addMonths(periodEndMilliseconds, cycle) / 1000;
    }

    const renewalTime = getReadableTime({ value: unixRenewalTime, format: 'PPP' });

    if (isScheduledChargedLater && subscription) {
        const autoRenewNote: string | string[] = (() => {
            if (cycle === CYCLE.MONTHLY) {
                return c('Info').jt`Your scheduled plan starts on ${renewalTime} and will auto-renew every month.`;
            }

            return c('Info').ngettext(
                msgid`Your scheduled plan starts on ${renewalTime} and will auto-renew every ${cycle} month.`,
                `Your scheduled plan starts on ${renewalTime} and will auto-renew every ${cycle} months.`,
                cycle
            );
        })();

        const nextBillingDate = c('Info')
            .t`Your next billing date is ${renewalTime}. Please contact support if you require an immediate plan change.`;

        return appendTermsAndConditionsLink([autoRenewNote, ' ', nextBillingDate], planIDs, cycle, app);
    }

    if (renewAmount && renewCycle) {
        const one = c('Info').t`Your subscription will automatically renew on ${renewalTime}.`;

        const renewAmountStr = getSimplePriceString(currency, renewAmount);

        const two = c('Info').ngettext(
            msgid`You'll then be billed every ${renewCycle} month at ${renewAmountStr}.`,
            `You'll then be billed every ${renewCycle} months at ${renewAmountStr}.`,
            renewCycle
        );

        return appendTermsAndConditionsLink([one, ' ', two], planIDs, cycle, app);
    }

    const start = (() => {
        if (cycle === CYCLE.MONTHLY) {
            return c('Info').t`Subscription auto-renews every month.`;
        }

        return c('Info').ngettext(
            msgid`Subscription auto-renews every ${cycle} month.`,
            `Subscription auto-renews every ${cycle} months.`,
            cycle
        );
    })();

    const nextBillingDate = c('Info').jt`Your next billing date is ${renewalTime}.`;
    return appendTermsAndConditionsLink([start, ' ', nextBillingDate], planIDs, cycle, app);
};

const getSpecialLengthRenewNoticeText = ({
    planIDs,
    plansMap,
    currency,
    subscription,
    renewAmount,
    renewCycle,
    ...renewalNoticeProps
}: {
    planIDs: PlanIDs;
    plansMap: PlansMap;
    currency: Currency;
    renewAmount: number | null;
    renewCycle: CYCLE | null;
} & RenewalNoticeProps) => {
    const { cycle } = renewalNoticeProps;

    const { renewPrice, renewalLength } = getOptimisticRenewCycleAndPrice({
        planIDs,
        plansMap,
        cycle,
        currency,
        renewAmount,
        renewCycle,
    });

    if (renewalLength === CYCLE.YEARLY) {
        let scheduledChangeText: string | string[] | null = null;
        if (subscription && renewalNoticeProps.isScheduled) {
            const renewalTime = getReadableTime({ value: subscription.PeriodEnd, format: 'PPP' });
            scheduledChangeText = c('vpn_2024: renew').t`Your scheduled plan starts on ${renewalTime}.`;
        }

        const renewLengthText = (() => {
            if (renewalNoticeProps.isScheduled) {
                return c('vpn_2024: renew').ngettext(
                    msgid`Your new subscription will automatically renew in ${cycle} month.`,
                    `Your new subscription will automatically renew in ${cycle} months.`,
                    cycle
                );
            }

            // translator: typically cycle is 1, 12, or 24 months.
            return c('vpn_2024: renew').ngettext(
                msgid`Your subscription will automatically renew in ${cycle} month.`,
                `Your subscription will automatically renew in ${cycle} months.`,
                cycle
            );
        })();

        const renewPriceStr = getSimplePriceString(currency, renewPrice);

        const renewPriceText = c('vpn_2024: renew').jt`You'll then be billed every 12 months at ${renewPriceStr}.`;

        let result = [renewLengthText, ' ', renewPriceText];
        if (scheduledChangeText) {
            result = [scheduledChangeText, ' ', ...result];
        }

        return result;
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
    renewAmount,
    renewCycle,
    app,
}: {
    cycle: CYCLE;
    planIDs: PlanIDs;
    plansMap: PlansMap;
    currency: Currency;
    coupon: Coupon;
    checkout: SubscriptionCheckoutData;
    short?: boolean;
    renewAmount: number | null;
    renewCycle: CYCLE | null;
    app: APP_NAMES;
}) => {
    if (!coupon || !coupon.MaximumRedemptionsPerUser) {
        return;
    }

    const couponRedemptions = coupon.MaximumRedemptionsPerUser;

    const priceWithDiscount = getSimplePriceString(currency, checkout.withDiscountPerCycle);

    const { renewPrice, renewalLength } = getOptimisticRenewCycleAndPrice({
        planIDs,
        plansMap,
        cycle: subscriptionLength,
        currency,
        renewAmount,
        renewCycle,
    });

    const renewPriceStr = getSimplePriceString(currency, renewPrice);

    if (couponRedemptions === 1) {
        if (short) {
            return c('Payments').jt`Renews at ${renewPriceStr}, cancel anytime.`;
        }

        if (subscriptionLength === CYCLE.MONTHLY) {
            return c('Payments')
                .t`The specially discounted price of ${priceWithDiscount} is valid for the first month. Then it will automatically be renewed at ${renewPriceStr} every month. You can cancel at any time.`;
        }

        const one = c('Payments').ngettext(
            msgid`The specially discounted price of ${priceWithDiscount} is valid for the first ${subscriptionLength} month.`,
            `The specially discounted price of ${priceWithDiscount} is valid for the first ${subscriptionLength} months.`,
            subscriptionLength
        );

        const two = c('Payments').ngettext(
            msgid`Then it will automatically be renewed at ${renewPriceStr} for ${renewalLength} month. You can cancel at any time.`,
            `Then it will automatically be renewed at ${renewPriceStr} for ${renewalLength} months. You can cancel at any time.`,
            renewalLength
        );

        return appendTermsAndConditionsLink([one, ' ', two], planIDs, subscriptionLength, app);
    }

    if (subscriptionLength === CYCLE.MONTHLY) {
        return c('Payments').ngettext(
            msgid`The specially discounted price of ${priceWithDiscount} is valid for the first month. The coupon is valid for ${couponRedemptions} renewal. Then it will automatically be renewed at ${renewPriceStr} for 1 month. You can cancel at any time.`,
            `The specially discounted price of ${priceWithDiscount} is valid for the first month. The coupon is valid for ${couponRedemptions} renewals. Then it will automatically be renewed at ${renewPriceStr} for 1 month. You can cancel at any time.`,
            couponRedemptions
        );
    }

    const one = c('Payments').ngettext(
        msgid`The specially discounted price of ${priceWithDiscount} is valid for the first ${subscriptionLength} month.`,
        `The specially discounted price of ${priceWithDiscount} is valid for the first ${subscriptionLength} months.`,
        subscriptionLength
    );

    const two = c('Payments').ngettext(
        msgid`The coupon is valid for ${couponRedemptions} renewal.`,
        `The coupon is valid for ${couponRedemptions} renewals.`,
        couponRedemptions
    );

    const three = c('Payments').ngettext(
        msgid`Then it will automatically be renewed at ${renewPriceStr} for ${renewalLength} month. You can cancel at any time.`,
        `Then it will automatically be renewed at ${renewPriceStr} for ${renewalLength} months. You can cancel at any time.`,
        renewalLength
    );

    return appendTermsAndConditionsLink([one, ' ', two, ' ', three], planIDs, subscriptionLength, app);
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
    renewAmount,
    renewCycle,
    app,
    ...renewalNoticeProps
}: {
    coupon: Coupon;
    cycle: CYCLE;
    planIDs: PlanIDs;
    plansMap: PlansMap;
    currency: Currency;
    checkout: SubscriptionCheckoutData;
    short?: boolean;
    renewAmount: number | null;
    renewCycle: CYCLE | null;
    app: APP_NAMES;
} & RenewalNoticeProps): ReactNode => {
    if (isLifetimePlanSelected(planIDs)) {
        return getLifetimeRenewNoticeText({ ...renewalNoticeProps, planIDs });
    }

    const isSpeciallyRenewedPlan = isSpecialRenewPlan(planIDs);
    if (isSpeciallyRenewedPlan) {
        const specialLengthRenewNotice = getSpecialLengthRenewNoticeText({
            cycle,
            planIDs,
            plansMap,
            currency,
            renewAmount,
            renewCycle,
            ...renewalNoticeProps,
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
        renewAmount,
        renewCycle,
        app,
    });

    if (limitedCouponsNotice) {
        return limitedCouponsNotice;
    }

    return getRegularRenewalNoticeText({
        cycle,
        planIDs,
        renewAmount,
        renewCycle,
        currency,
        app,
        ...renewalNoticeProps,
    });
};

export const getCheckoutRenewNoticeTextFromCheckResult = ({
    checkResult,
    plansMap,
    planIDs,
    short,
    subscription,
    app,
}: {
    checkResult: RequiredCheckResponse;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    short?: boolean;
    subscription?: Subscription;
    app: APP_NAMES;
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
        renewAmount: checkResult.BaseRenewAmount,
        renewCycle: checkResult.RenewCycle,
        subscription,
        app,
        ...getCheckoutModifiers(checkResult),
    });
};
