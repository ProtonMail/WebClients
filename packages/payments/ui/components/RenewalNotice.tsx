import type { ReactNode } from 'react';

import { addDays, addMonths, getUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import Time, { getReadableTime } from '@proton/components/components/time/Time';
import { type APP_NAMES, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { getTermsURL } from '@proton/shared/lib/helpers/url';

import { type PaymentsCheckoutUI, getCheckoutUi } from '../../core/checkout';
import { type CheckoutModifiers, getCheckoutModifiers } from '../../core/checkout-modifiers';
import { CYCLE, PLANS, PLAN_NAMES, TRIAL_DURATION_DAYS } from '../../core/constants';
import type { Currency, Cycle, FreeSubscription, PlanIDs } from '../../core/interface';
import { getPlanNameFromIDs, isLifetimePlanSelected } from '../../core/plan/helpers';
import type { PlansMap } from '../../core/plan/interface';
import { SubscriptionMode, TaxInclusive } from '../../core/subscription/constants';
import { getPlanName, getPlanTitle } from '../../core/subscription/helpers';
import type { Coupon, Subscription, SubscriptionEstimation } from '../../core/subscription/interface';
import { isFreeSubscription } from '../../core/type-guards';

const getRenewalPricingSubjectToChangeText = (app: APP_NAMES): string | string[] | null => {
    const termsAndConditionsUrl = getTermsURL(app);
    // translator: Full sentence is: Renewal pricing subject to change according to <terms and conditions>.
    const termsAndConditionsLink = (
        <Href className="color-inherit" href={termsAndConditionsUrl} key="terms-and-conditions">
            {c('Payments').t`terms and conditions`}
        </Href>
    );

    // translator: Full sentence is: Renewal pricing subject to change according to <terms and conditions>.
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
    subscription?: Subscription | FreeSubscription;
} & Partial<CheckoutModifiers>;

export function calculateRenewalTimeDuringCheckout(
    subscription: Subscription | FreeSubscription | undefined,
    cycle: CYCLE,
    isCustomBilling: boolean | undefined,
    isScheduledChargedLater: boolean | undefined,
    isScheduledChargedImmediately: boolean | undefined
) {
    let unixRenewalTime: number = +addMonths(new Date(), cycle) / 1000;
    // custom billings are renewed at the end of the current subscription.
    // addon downgrades are more tricky. On the first glance they behave like scheduled subscriptions,
    // because they indeed create an upcoming subscription. But when subscription/check returns addon
    // downgrade then user pays nothing now, and the scheduled subscription will still be created.
    // The payment happens when the upcoming subscription becomes the current one. So the next billing date is still
    // the end of the current subscription.
    if ((isCustomBilling || isScheduledChargedLater) && subscription && !isFreeSubscription(subscription)) {
        unixRenewalTime = subscription.PeriodEnd;
    } else if (isScheduledChargedImmediately && subscription && !isFreeSubscription(subscription)) {
        const periodEndMilliseconds = subscription.PeriodEnd * 1000;
        unixRenewalTime = +addMonths(periodEndMilliseconds, cycle) / 1000;
    }

    return getReadableTime({ value: unixRenewalTime, format: 'PPP' });
}

export function formatPriceWithTaxes(currency: Currency, amount: number, checkout: PaymentsCheckoutUI) {
    const formattedPrice = getSimplePriceString(currency, amount);

    if (checkout.checkResult.TaxInclusive === TaxInclusive.EXCLUSIVE) {
        // translator: This will be displayed as part of other text. Example: "CHF 2256.56 (excl. tax)"
        return c('Payments').t`${formattedPrice} (excl. tax)`;
    }

    return formattedPrice;
}

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
    checkout: PaymentsCheckoutUI;
    currency: Currency;
    app: APP_NAMES;
}) => {
    const renewalTime = calculateRenewalTimeDuringCheckout(
        subscription,
        cycle,
        isCustomBilling,
        isScheduledChargedLater,
        isScheduledChargedImmediately
    );

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
            .t`Your next billing date is ${renewalTime}. You can cancel at any time. Please contact support if you require an immediate plan change.`;

        return appendTermsAndConditionsLink([autoRenewNote, ' ', nextBillingDate], app);
    }

    const renewAmount = checkout.renewPrice;
    const renewCycle = checkout.renewCycle;

    if (checkout.renewPriceOverriden || checkout.renewCycleOverriden) {
        const one = c('Info').t`Your subscription will automatically renew on ${renewalTime}.`;

        const renewAmountStr = formatPriceWithTaxes(currency, renewAmount, checkout);

        const two = c('Info').ngettext(
            msgid`You'll then be billed every ${renewCycle} month at ${renewAmountStr}. You can cancel at any time.`,
            `You'll then be billed every ${renewCycle} months at ${renewAmountStr}. You can cancel at any time.`,
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

    const nextBillingDate = c('Info').jt`Your next billing date is ${renewalTime}. You can cancel at any time.`;
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
    checkout: PaymentsCheckoutUI;
    short?: boolean;
    app: APP_NAMES;
}) => {
    if (!coupon || !coupon.MaximumRedemptionsPerUser) {
        return;
    }

    const couponRedemptions = coupon.MaximumRedemptionsPerUser;

    const priceWithDiscount = formatPriceWithTaxes(currency, checkout.withDiscountPerCycle, checkout);

    const renewPrice = checkout.renewPrice;
    const renewalLength = checkout.renewCycle;

    const renewPriceStr = formatPriceWithTaxes(currency, renewPrice, checkout);

    const isCustomBilling = checkout.checkResult.SubscriptionMode === SubscriptionMode.CustomBillings;

    if (couponRedemptions === 1) {
        if (short) {
            return appendTermsAndConditionsLink(c('Payments').jt`Renews at ${renewPriceStr}, cancel anytime.`, app, {
                short: true,
            });
        }

        if (subscriptionLength === CYCLE.MONTHLY) {
            if (isCustomBilling) {
                return appendTermsAndConditionsLink(
                    c('Payments')
                        .t`The specially discounted price is valid for the first month. Then it will automatically be renewed at ${renewPriceStr} every month. You can cancel at any time.`,
                    app
                );
            }

            return appendTermsAndConditionsLink(
                c('Payments')
                    .t`The specially discounted price of ${priceWithDiscount} is valid for the first month. Then it will automatically be renewed at ${renewPriceStr} every month. You can cancel at any time.`,
                app
            );
        }

        const one = (() => {
            if (isCustomBilling) {
                return c('Payments').ngettext(
                    msgid`The specially discounted price is valid for the first ${subscriptionLength} month.`,
                    `The specially discounted price is valid for the first ${subscriptionLength} months.`,
                    subscriptionLength
                );
            }

            return c('Payments').ngettext(
                msgid`The specially discounted price of ${priceWithDiscount} is valid for the first ${subscriptionLength} month.`,
                `The specially discounted price of ${priceWithDiscount} is valid for the first ${subscriptionLength} months.`,
                subscriptionLength
            );
        })();

        const two = c('Payments').ngettext(
            msgid`Then it will automatically be renewed at ${renewPriceStr} for ${renewalLength} month. You can cancel at any time.`,
            `Then it will automatically be renewed at ${renewPriceStr} for ${renewalLength} months. You can cancel at any time.`,
            renewalLength
        );

        return appendTermsAndConditionsLink([one, ' ', two], app);
    }

    // below that line, couponRedemptions is greater than 1, see the if condition above
    const renewalsWithCoupon = couponRedemptions - 1;
    if (subscriptionLength === CYCLE.MONTHLY) {
        if (isCustomBilling) {
            return appendTermsAndConditionsLink(
                c('Payments').ngettext(
                    msgid`The specially discounted price is valid for ${couponRedemptions} month. Then it will automatically be renewed at ${renewPriceStr} for 1 month. You can cancel at any time.`,
                    `The specially discounted price is valid for ${couponRedemptions} months. Then it will automatically be renewed at ${renewPriceStr} for 1 month. You can cancel at any time.`,
                    couponRedemptions
                ),
                app
            );
        }

        return appendTermsAndConditionsLink(
            c('Payments').ngettext(
                msgid`The specially discounted price of ${priceWithDiscount} is valid for ${couponRedemptions} month. Then it will automatically be renewed at ${renewPriceStr} for 1 month. You can cancel at any time.`,
                `The specially discounted price of ${priceWithDiscount} is valid for ${couponRedemptions} months. Then it will automatically be renewed at ${renewPriceStr} for 1 month. You can cancel at any time.`,
                couponRedemptions
            ),
            app
        );
    }

    const one = (() => {
        if (isCustomBilling) {
            return c('Payments').ngettext(
                msgid`The specially discounted price is valid for the first ${subscriptionLength} month.`,
                `The specially discounted price is valid for the first ${subscriptionLength} months.`,
                subscriptionLength
            );
        }

        return c('Payments').ngettext(
            msgid`The specially discounted price of ${priceWithDiscount} is valid for the first ${subscriptionLength} month.`,
            `The specially discounted price of ${priceWithDiscount} is valid for the first ${subscriptionLength} months.`,
            subscriptionLength
        );
    })();

    const two = c('Payments').ngettext(
        msgid`The discount is valid for ${renewalsWithCoupon} renewal.`,
        `The discount is valid for ${renewalsWithCoupon} renewals.`,
        renewalsWithCoupon
    );

    const three = c('Payments').ngettext(
        msgid`Then it will automatically be renewed at ${renewPriceStr} for ${renewalLength} month. You can cancel at any time.`,
        `Then it will automatically be renewed at ${renewPriceStr} for ${renewalLength} months. You can cancel at any time.`,
        renewalLength
    );

    return appendTermsAndConditionsLink([one, ' ', two, ' ', three], app);
};

const getPassLifetimeRenewNoticeText = ({
    subscription,
    app,
}: {
    subscription?: Subscription | FreeSubscription;
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

const getLifetimeRenewNoticeText = ({
    subscription,
    planIDs,
    app,
}: {
    planIDs: PlanIDs;
    subscription?: Subscription | FreeSubscription;
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
    checkout: PaymentsCheckoutUI;
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

    // duplication to prevent react warning about key being not unique
    const formattedDate1 = <Time key="trial-end-date-1">{getUnixTime(trialEndDate)}</Time>;
    const formattedDate2 = <Time key="trial-end-date-2">{getUnixTime(trialEndDate)}</Time>;

    if (renewCycle === CYCLE.MONTHLY) {
        return c('b2b_trials_2025_Info')
            .jt`After the trial ends on ${formattedDate1}, it will become a paid subscription that auto-renews monthly. You won’t be charged if you cancel before ${formattedDate2}.`;
    }

    return c('b2b_trials_2025_Info')
        .jt`After the trial ends on ${formattedDate1}, it will become a paid subscription that auto-renews every ${renewCycle} months. You won’t be charged if you cancel before ${formattedDate2}.`;
};

export const getTrialRenewalAmountDueNoticeText = () => {
    const trialEndDate = addDays(new Date(), TRIAL_DURATION_DAYS);
    const formattedDate = <Time key="trial-end-date-amount-due">{getUnixTime(trialEndDate)}</Time>;

    return c('Payments').jt`Amount due after trial on ${formattedDate}`;
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
    checkResult: SubscriptionEstimation;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    short?: boolean;
    subscription?: Subscription | FreeSubscription;
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
        checkout: getCheckoutUi({
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
