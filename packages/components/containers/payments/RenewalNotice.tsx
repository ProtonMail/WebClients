import type { ReactNode } from 'react';

import { addDays, addMonths, getUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { Href } from '@proton/atoms';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import Time, { getReadableTime } from '@proton/components/components/time/Time';
import {
    CYCLE,
    type CheckoutModifiers,
    type Coupon,
    type Currency,
    type Cycle,
    PLANS,
    PLAN_NAMES,
    type PaymentsCheckout,
    type PlanIDs,
    type PlansMap,
    type RequiredCheckResponse,
    type Subscription,
    SubscriptionMode,
    TRIAL_DURATION_DAYS,
    getCheckout,
    getCheckoutModifiers,
    getPlanName,
    getPlanNameFromIDs,
    getPlanTitle,
    isLifetimePlanSelected,
} from '@proton/payments';
import { type APP_NAMES, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { getTermsURL } from '@proton/shared/lib/helpers/url';

export const getRenewalPricingSubjectToChangeText = (app: APP_NAMES): string | string[] | null => {
    const termsAndConditionsUrl = getTermsURL(app);
    const termsAndConditionsLink = (
        <Href className="color-inherit" href={termsAndConditionsUrl}>
            {c('Payments').t`terms & conditions`}
        </Href>
    );

    return c('Payments').jt`Renewal pricing subject to change according to ${termsAndConditionsLink}.`;
};

type Translation = string | (string | string[])[];

const appendTermsAndConditionsLink = (
    text: Translation,
    app: APP_NAMES,
    options?: { short?: boolean }
): Translation => {
    const short = options?.short ?? false;
    if (short) {
        return text;
    }

    const link = getRenewalPricingSubjectToChangeText(app);
    if (!link) {
        return text;
    }

    return [...text, ' ', link];
};

type RenewalNoticeProps = {
    cycle: CYCLE;
    subscription?: Subscription;
} & Partial<CheckoutModifiers>;

const getRegularRenewalNoticeText = ({
    checkout,
    cycle,
    isCustomBilling,
    isScheduledChargedImmediately,
    isScheduledChargedLater,
    subscription,
    currency,
    app,
}: RenewalNoticeProps & {
    checkout: PaymentsCheckout;
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

        return appendTermsAndConditionsLink([autoRenewNote, ' ', nextBillingDate], app);
    }

    const renewAmount = checkout.renewPrice;
    const renewCycle = checkout.renewCycle;

    if (checkout.renewPriceOverriden || checkout.renewCycleOverriden) {
        const one = c('Info').t`Your subscription will automatically renew on ${renewalTime}.`;

        const renewAmountStr = getSimplePriceString(currency, renewAmount);

        const two = c('Info').ngettext(
            msgid`You'll then be billed every ${renewCycle} month at ${renewAmountStr}.`,
            `You'll then be billed every ${renewCycle} months at ${renewAmountStr}.`,
            renewCycle
        );

        return appendTermsAndConditionsLink([one, ' ', two], app);
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
    return appendTermsAndConditionsLink([start, ' ', nextBillingDate], app);
};

const getRenewNoticeTextForLimitedCoupons = ({
    coupon,
    cycle: subscriptionLength, // Elaborate name of the variable to help the translators
    currency,
    checkout,
    short,
    app,
}: {
    cycle: CYCLE;
    currency: Currency;
    coupon: Coupon;
    checkout: PaymentsCheckout;
    short?: boolean;
    app: APP_NAMES;
}) => {
    if (!coupon || !coupon.MaximumRedemptionsPerUser) {
        return;
    }

    const couponRedemptions = coupon.MaximumRedemptionsPerUser;

    const priceWithDiscount = getSimplePriceString(currency, checkout.withDiscountPerCycle);

    const renewPrice = checkout.renewPrice;
    const renewalLength = checkout.renewCycle;

    const renewPriceStr = getSimplePriceString(currency, renewPrice);

    if (couponRedemptions === 1) {
        if (short) {
            return appendTermsAndConditionsLink(c('Payments').jt`Renews at ${renewPriceStr}, cancel anytime.`, app, {
                short: true,
            });
        }

        if (subscriptionLength === CYCLE.MONTHLY) {
            return appendTermsAndConditionsLink(
                c('Payments')
                    .t`The specially discounted price of ${priceWithDiscount} is valid for the first month. Then it will automatically be renewed at ${renewPriceStr} every month. You can cancel at any time.`,
                app
            );
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

        return appendTermsAndConditionsLink([one, ' ', two], app);
    }

    if (subscriptionLength === CYCLE.MONTHLY) {
        return appendTermsAndConditionsLink(
            c('Payments').ngettext(
                msgid`The specially discounted price of ${priceWithDiscount} is valid for the first month. The coupon is valid for ${couponRedemptions} renewal. Then it will automatically be renewed at ${renewPriceStr} for 1 month. You can cancel at any time.`,
                `The specially discounted price of ${priceWithDiscount} is valid for the first month. The coupon is valid for ${couponRedemptions} renewals. Then it will automatically be renewed at ${renewPriceStr} for 1 month. You can cancel at any time.`,
                couponRedemptions
            ),
            app
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

    return appendTermsAndConditionsLink([one, ' ', two, ' ', three], app);
};

export const getPassLifetimeRenewNoticeText = ({
    subscription,
    app,
}: {
    subscription?: Subscription;
    app: APP_NAMES;
}) => {
    const planName = getPlanName(subscription);
    if (!planName || planName === PLANS.FREE) {
        return c('Info')
            .t`${PASS_SHORT_APP_NAME} lifetime deal has no renewal price, it's a one-time payment for lifetime access to ${PASS_SHORT_APP_NAME}.`;
    }

    if (planName === PLANS.PASS) {
        const plan = PLAN_NAMES[PLANS.PASS];
        return c('Info')
            .t`Your ${plan} subscription will be replaced with ${PASS_SHORT_APP_NAME} Lifetime. The remaining balance of your subscription will be added to your account. ${PASS_SHORT_APP_NAME} lifetime deal has no renewal price, it's a one-time payment for lifetime access to ${PASS_SHORT_APP_NAME}.`;
    }

    const planTitle = getPlanTitle(subscription);
    return appendTermsAndConditionsLink(
        c('Info')
            .t`${PASS_SHORT_APP_NAME} lifetime deal has no renewal price, it's a one-time payment for lifetime access to ${PASS_SHORT_APP_NAME}. Your ${planTitle} subscription renewal price and date remain unchanged.`,
        app
    );
};

export const getLifetimeRenewNoticeText = ({
    subscription,
    planIDs,
    app,
}: {
    planIDs: PlanIDs;
    subscription?: Subscription;
    app: APP_NAMES;
}) => {
    const planName = getPlanNameFromIDs(planIDs);
    if (planName === PLANS.PASS_LIFETIME) {
        return getPassLifetimeRenewNoticeText({ subscription, app });
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
    app,
    ...renewalNoticeProps
}: {
    coupon: Coupon;
    cycle: CYCLE;
    planIDs: PlanIDs;
    plansMap: PlansMap;
    currency: Currency;
    checkout: PaymentsCheckout;
    short?: boolean;
    app: APP_NAMES;
} & RenewalNoticeProps): ReactNode => {
    if (isLifetimePlanSelected(planIDs)) {
        return getLifetimeRenewNoticeText({ ...renewalNoticeProps, planIDs, app });
    }

    const limitedCouponsNotice = getRenewNoticeTextForLimitedCoupons({
        coupon,
        cycle,
        currency,
        checkout,
        short,
        app,
    });

    if (limitedCouponsNotice) {
        return limitedCouponsNotice;
    }

    return getRegularRenewalNoticeText({
        checkout,
        cycle,
        currency,
        app,
        ...renewalNoticeProps,
    });
};

const getTrialRenewalNoticeText = ({ renewCycle }: { renewCycle: Cycle }) => {
    const trialEndDate = addDays(new Date(), TRIAL_DURATION_DAYS);
    const formattedDate = <Time>{getUnixTime(trialEndDate)}</Time>;

    if (renewCycle === CYCLE.MONTHLY) {
        return c('Payments').jt`You will be charged on ${formattedDate}, renewing every month.`;
    }

    return c('Payments').jt`You will be charged on ${formattedDate}, renewing every ${renewCycle} months.`;
};

export const getTrialRenewalNoticeTextWithTermsAndConditions = ({
    renewCycle,
    app,
}: {
    renewCycle: Cycle | null;
    app: APP_NAMES;
}) => {
    if (renewCycle === null) {
        return '';
    }

    return appendTermsAndConditionsLink(getTrialRenewalNoticeText({ renewCycle }), app);
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
    const isTrial = checkResult.SubscriptionMode === SubscriptionMode.Trial;

    if (isTrial) {
        return getTrialRenewalNoticeTextWithTermsAndConditions({ renewCycle: checkResult.RenewCycle, app });
    }

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
        subscription,
        app,
        ...getCheckoutModifiers(checkResult),
    });
};
