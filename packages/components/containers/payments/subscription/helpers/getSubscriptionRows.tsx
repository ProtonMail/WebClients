import type { ReactNode } from 'react';

import { format, fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import type { CYCLE } from '@proton/payments/core/constants';
import { hasLifetimeCoupon } from '@proton/payments/core/coupons';
import type { Currency } from '@proton/payments/core/interface';
import {
    getEffectiveUpcomingSubscription,
    getSubscriptionPlanTitle,
    isAddonDowngrade,
    isManagedExternally,
    isSameCycle,
    shouldHaveUpcomingSubscription,
    subscriptionExpires,
} from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getTrialInfoForSingleSubscription } from '@proton/payments/core/trials';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { UserModel } from '@proton/shared/lib/interfaces';

import type { BadgeType } from '../../../../components/badge/Badge';
import Info from '../../../../components/link/Info';
import { getSimplePriceString } from '../../../../components/price/helper';
import { getSubscriptionManagerName } from '../InAppPurchaseModal';

// A renewal notice rendered as up to two lines: the next charge (primary) and the eventual recurring price (secondary).
interface RenewalText {
    primary: string;
    secondary?: string;
}

type SubscriptionRowKind = 'current' | 'upcoming';

export interface SubscriptionRow {
    id: string;
    kind: SubscriptionRowKind;
    subscription: Subscription;
    parent?: Subscription;
    planTitle: string | undefined;
    startDate: number;
    endDate: number | undefined;
    price: number;
    renewAmount: number;
    renewCurrency: Currency;
    renewCycle: CYCLE;
    hasCoupon: boolean;
    isLifetime: boolean;
    isManagedExternally: boolean;
    isExpiring: boolean;
    showReactivate: boolean;
    hideRenewalText: boolean;
    hasSeparateUpcomingRow: boolean;
    scheduledChange?: ScheduledChange;
    billingType: 'prepaid' | 'billed-at-renewal';
    status: {
        type: BadgeType;
        label: string;
    };
    renewalText: RenewalText | null;
    renewalTooltip: ReactNode;
}

type ScheduledChangeKind = 'amount-change' | 'prepaid-upgrade' | 'unpaid-change';

interface ScheduledChange {
    kind: ScheduledChangeKind;
    isPrepaid: boolean;
    nextCycle: CYCLE;
    // The eventual full recurring price, once any introductory coupon has reverted (BaseRenewAmount-based).
    recurringAmount: number;
    // The discounted charge the user actually pays at the transition (0 when the upcoming term is free or prepaid).
    nextChargeAmount: number;
    // Cycle of the eventual recurring price — can differ from nextCycle on a prepaid cycle upgrade (e.g. 24m → 12m).
    recurringCycle: CYCLE;
    prepaidAmount: number;
    nextCurrency: Currency;
    effectiveDate: number;
}

// Only an invoiced term has a final Amount; without one a 0 means "not priced yet", not "free".
const isTermPriced = (subscription: Subscription): boolean => subscription.IsPrepaid || subscription.Amount > 0;

export const getSubscriptionRenewData = (
    subscription: Subscription,
    isUpcomingTerm: boolean
): {
    // What the user is charged at the next billing moment, and the cycle that charge buys.
    nextChargeAmount: number;
    nextChargeCycle: CYCLE;
    // What the term after that costs, once any introductory discount has reverted.
    recurringAmount: number;
    recurringCycle: CYCLE;
    renewCurrency: Currency;
} => {
    // Current term: RenewAmount is the next charge and the steady price — no later revert to announce.
    if (!isUpcomingTerm) {
        return {
            nextChargeAmount: subscription.RenewAmount,
            nextChargeCycle: subscription.RenewCycle ?? subscription.Cycle,
            recurringAmount: subscription.RenewAmount,
            recurringCycle: subscription.RenewCycle ?? subscription.Cycle,
            renewCurrency: subscription.Currency,
        };
    }

    // BaseRenewAmount is all there is to go on before the term is priced, and it leaves no revert to announce.
    if (!isTermPriced(subscription)) {
        return {
            nextChargeAmount: subscription.BaseRenewAmount,
            nextChargeCycle: subscription.Cycle,
            recurringAmount: subscription.BaseRenewAmount,
            recurringCycle: subscription.Cycle,
            renewCurrency: subscription.Currency,
        };
    }

    // Amount prices this term; RenewAmount and RenewCycle describe the term after it.
    return {
        nextChargeAmount: subscription.Amount,
        nextChargeCycle: subscription.Cycle,
        recurringAmount: subscription.RenewAmount || subscription.Amount,
        recurringCycle: subscription.RenewCycle || subscription.Cycle,
        renewCurrency: subscription.Currency,
    };
};

// A 0 Amount means either the term was discounted to nothing, or the API never priced it (a superseded term whose
// charge moved to the upcoming one). Only a discount explains a genuinely free term.
const getTermPrice = (subscription: Subscription): number => {
    // A trial reports Amount 0 with no Discount, and that 0 is the real price of the term.
    if (subscription.IsTrial) {
        return 0;
    }

    if (subscription.Amount) {
        return subscription.Amount;
    }

    if (subscription.Discount) {
        return 0;
    }

    return subscription.BaseRenewAmount;
};

const getRenewalTooltip = (isLifetime: boolean): ReactNode => {
    return isLifetime ? (
        <Info
            className="ml-2"
            title={c('Payments.Lifetime Subscription').t`Reach out to Customer Support to confirm ownership change`}
        />
    ) : null;
};

const getStatus = (
    subscription: Subscription,
    kind: SubscriptionRowKind,
    isExpiring: boolean
): SubscriptionRow['status'] => {
    const isUpcomingKind = kind === 'upcoming';

    if (isUpcomingKind) {
        return {
            type: 'info',
            label: c('Subscription status').t`Upcoming`,
        };
    }

    if (isExpiring) {
        return {
            type: 'error',
            label: c('Subscription status').t`Expiring`,
        };
    }

    if (getTrialInfoForSingleSubscription(subscription).isTrial) {
        return {
            type: 'success',
            label: c('Subscription status').t`Free Trial`,
        };
    }

    return {
        type: 'success',
        label: c('Subscription status').t`Active`,
    };
};

// IsPrepaid is only populated for upcoming terms: the active subscription always has an invoice, and always reports
// false. A trial is the one active term with no invoice yet.
const getBillingType = (
    subscription: Subscription,
    kind: SubscriptionRowKind,
    scheduledChange: ScheduledChange | undefined
): SubscriptionRow['billingType'] => {
    if (subscription.IsTrial) {
        return 'billed-at-renewal';
    }

    if (kind === 'upcoming') {
        return subscription.IsPrepaid ? 'prepaid' : 'billed-at-renewal';
    }

    if (scheduledChange && !scheduledChange.isPrepaid) {
        return 'billed-at-renewal';
    }

    return 'prepaid';
};

const getRenewalPriceText = (price: string, cycle: number): string =>
    // translator: e.g. "Renews automatically at CHF 119.88, for 12 months"
    c('Billing cycle').ngettext(
        msgid`Renews automatically at ${price}, for ${cycle} month`,
        `Renews automatically at ${price}, for ${cycle} months`,
        cycle
    );

// The muted second line: the eventual recurring price once any introductory coupon has reverted.
const getRecurringPriceText = (price: string, cycle: number): string =>
    // translator: e.g. "Then CHF 119.88, for 12 months"
    c('Billing cycle').ngettext(msgid`Then ${price}, for ${cycle} month`, `Then ${price}, for ${cycle} months`, cycle);

// Explains a same-plan scheduled change that was folded into the current row.
const getScheduledChangeText = (scheduledChange: NonNullable<SubscriptionRow['scheduledChange']>): RenewalText => {
    const {
        kind,
        nextCycle,
        recurringAmount,
        nextChargeAmount,
        recurringCycle,
        prepaidAmount,
        nextCurrency,
        effectiveDate,
    } = scheduledChange;
    const fullPrice = getSimplePriceString(nextCurrency, recurringAmount);
    const introPrice = getSimplePriceString(nextCurrency, nextChargeAmount);
    const when = format(fromUnixTime(effectiveDate), 'PPP', { locale: dateLocale });

    const isRecurringPriceDiffers = recurringAmount > 0 && recurringAmount !== nextChargeAmount;
    const secondary = isRecurringPriceDiffers ? getRecurringPriceText(fullPrice, recurringCycle) : undefined;

    if (kind === 'prepaid-upgrade') {
        const paidPrice = getSimplePriceString(nextCurrency, prepaidAmount);
        // translator: e.g. "Switches to 12 months on May 1, 2026 (CHF 119.88 already paid)"
        return {
            primary: c('Billing cycle').ngettext(
                msgid`Switches to ${nextCycle} month on ${when} (${paidPrice} already paid)`,
                `Switches to ${nextCycle} months on ${when} (${paidPrice} already paid)`,
                nextCycle
            ),
            secondary,
        };
    }

    if (kind === 'amount-change') {
        if (nextChargeAmount === 0) {
            return { primary: c('Billing cycle').t`Free renewal`, secondary };
        }
        return {
            primary: getRenewalPriceText(introPrice, nextCycle),
            secondary,
        };
    }

    if (nextChargeAmount === 0) {
        // translator: e.g. "Free renewal, for 1 month, on May 1, 2026"
        return {
            primary: c('Billing cycle').ngettext(
                msgid`Free renewal, for ${nextCycle} month, on ${when}`,
                `Free renewal, for ${nextCycle} months, on ${when}`,
                nextCycle
            ),
            secondary,
        };
    }
    // translator: e.g. "Renews automatically at CHF 9.99, for 1 month, on May 1, 2026"
    return {
        primary: c('Billing cycle').ngettext(
            msgid`Renews automatically at ${introPrice}, for ${nextCycle} month, on ${when}`,
            `Renews automatically at ${introPrice}, for ${nextCycle} months, on ${when}`,
            nextCycle
        ),
        secondary,
    };
};

type RenewalTextInput = Pick<
    SubscriptionRow,
    | 'subscription'
    | 'isLifetime'
    | 'isManagedExternally'
    | 'hideRenewalText'
    | 'scheduledChange'
    | 'hasSeparateUpcomingRow'
    | 'renewAmount'
    | 'renewCurrency'
    | 'renewCycle'
>;

const getRenewalText = (row: RenewalTextInput): RenewalText | null => {
    if (row.isLifetime) {
        return { primary: c('Payments.Lifetime Subscription').t`Lifetime accounts can be transferred or sold` };
    }

    if (row.isManagedExternally) {
        const subscriptionManagerName = getSubscriptionManagerName(row.subscription.External);
        // translator: possible values are "Google Play" or "Apple App Store".
        return { primary: c('Billing cycle').t`Renews automatically on ${subscriptionManagerName}` };
    }

    if (row.hideRenewalText) {
        return null;
    }

    // A scheduled change folded into this row — explain it instead of the plain renewal.
    if (row.scheduledChange) {
        return getScheduledChangeText(row.scheduledChange);
    }

    // The upcoming term is rendered as its own row just below.
    if (row.hasSeparateUpcomingRow && row.subscription.UpcomingSubscription) {
        const replacementDate = format(fromUnixTime(row.subscription.UpcomingSubscription.PeriodStart), 'PPP', {
            locale: dateLocale,
        });
        return {
            primary: c('Billing cycle').t`Will be replaced by your upcoming subscription on ${replacementDate}`,
        };
    }

    if (row.renewAmount === 0) {
        return { primary: c('Billing cycle').t`Free renewal` };
    }

    const renewPrice = getSimplePriceString(row.renewCurrency, row.renewAmount);

    return {
        primary: getRenewalPriceText(renewPrice, row.renewCycle),
    };
};

const getScheduledChangeKind = (current: Subscription, upcoming: Subscription): ScheduledChangeKind => {
    if (isSameCycle(current, upcoming)) {
        return 'amount-change';
    }
    return upcoming.IsPrepaid ? 'prepaid-upgrade' : 'unpaid-change';
};

const getScheduledChange = (current: Subscription, upcoming: Subscription): ScheduledChange => {
    const { nextChargeAmount, recurringAmount, recurringCycle, renewCurrency } = getSubscriptionRenewData(
        upcoming,
        true
    );

    return {
        kind: getScheduledChangeKind(current, upcoming),
        isPrepaid: upcoming.IsPrepaid,
        nextCycle: upcoming.Cycle,
        recurringAmount,
        nextChargeAmount,
        recurringCycle,
        prepaidAmount: upcoming.Amount,
        nextCurrency: renewCurrency,
        effectiveDate: upcoming.PeriodStart,
    };
};

const forgeSubscriptionRow = (row: {
    user: UserModel;
    subscription: Subscription;
    kind: SubscriptionRowKind;
    hasSeparateUpcomingRow: boolean;
    parent?: Subscription;
    scheduledChange?: ScheduledChange;
}): SubscriptionRow => {
    const { user, subscription, kind, hasSeparateUpcomingRow, parent, scheduledChange } = row;

    const { planTitle } = getSubscriptionPlanTitle(user, subscription);
    const { renewDisabled, subscriptionExpiresSoon } = subscriptionExpires(subscription);
    const managedExternally = isManagedExternally(subscription);
    const isUpcomingKind = kind === 'upcoming';
    const { nextChargeAmount, nextChargeCycle, recurringAmount, renewCurrency } = getSubscriptionRenewData(
        subscription,
        isUpcomingKind
    );
    const rowRenewAmount = isUpcomingKind ? nextChargeAmount : recurringAmount;
    // An unpaid upcoming term has Amount == 0 until the charge is computed, so show what it will cost, not the 0.
    const rowPrice = isUpcomingKind ? subscription.Amount || nextChargeAmount : getTermPrice(subscription);

    const isLifetime = hasLifetimeCoupon(subscription);
    const hideRenewalText = shouldHaveUpcomingSubscription(subscription) && !subscription.UpcomingSubscription;

    return {
        id: `${subscription.ID}-${kind}`,
        kind,
        subscription,
        parent,
        planTitle,
        price: rowPrice,
        renewAmount: rowRenewAmount,
        renewCurrency,
        renewCycle: nextChargeCycle,
        startDate: subscription.PeriodStart,
        endDate: subscription.PeriodEnd,
        hasCoupon: !!(subscription?.CouponCode && subscription?.CouponCode?.length > 0),
        isLifetime,
        isManagedExternally: managedExternally,
        isExpiring: subscriptionExpiresSoon,
        showReactivate: !isUpcomingKind && renewDisabled && !managedExternally,
        hideRenewalText,
        hasSeparateUpcomingRow,
        scheduledChange,
        billingType: getBillingType(subscription, kind, scheduledChange),
        status: getStatus(subscription, kind, subscriptionExpiresSoon),
        renewalTooltip: getRenewalTooltip(isLifetime),
        renewalText: getRenewalText({
            subscription,
            isLifetime,
            isManagedExternally: managedExternally,
            hideRenewalText,
            scheduledChange,
            hasSeparateUpcomingRow,
            renewAmount: rowRenewAmount,
            renewCurrency,
            renewCycle: nextChargeCycle,
        }),
    };
};

const extractInnerUpcomingSubscription = (user: UserModel, subscription: Subscription): SubscriptionRow[] => {
    const upcoming = getEffectiveUpcomingSubscription(subscription);

    if (upcoming && !isAddonDowngrade(subscription, upcoming)) {
        return [
            forgeSubscriptionRow({
                user,
                subscription,
                kind: 'current',
                hasSeparateUpcomingRow: false,
                scheduledChange: getScheduledChange(subscription, upcoming),
            }),
        ];
    }

    const rows: SubscriptionRow[] = [
        forgeSubscriptionRow({ user, subscription, kind: 'current', hasSeparateUpcomingRow: !!upcoming }),
    ];
    if (upcoming) {
        rows.push(
            forgeSubscriptionRow({
                user,
                subscription: upcoming,
                kind: 'upcoming',
                hasSeparateUpcomingRow: false,
                parent: subscription,
            })
        );
    }
    return rows;
};

// A free secondary subscription has no plan, price or renewal to show — it isn't a billing row.
export const getSubscriptionRows = (user: UserModel, subscriptions: Subscription[]): SubscriptionRow[] =>
    subscriptions
        .filter(isPaidSubscription)
        .flatMap((subscription) => extractInnerUpcomingSubscription(user, subscription));
