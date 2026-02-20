import type { Subscription } from '../../../core/subscription/interface';
import { isFreeSubscription } from '../../../core/type-guards';
import { calculateRenewalTimeDuringCheckout } from '../../components/RenewalNotice';
import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const NEXT_BILLING_LINE_ITEM_TYPE = 'nextBilling' as const;

/**
 * If user creates a scheduled subscription, then this will be a displayed start date for the scheduled subscription.
 */
export interface NextBillingLineItem
    extends BaseLineItem<typeof NEXT_BILLING_LINE_ITEM_TYPE>, ReturnType<typeof formatNextBilling> {}

function formatNextBilling(ctx: HeadlessCheckoutContextInner) {
    const { modifiers, subscription, cycle } = ctx;

    // Start date
    const isSubscriptionWithPeriodEnd = !!subscription && !isFreeSubscription(subscription);
    const currentSubscriptionPeriodEnd = isSubscriptionWithPeriodEnd ? (subscription as Subscription).PeriodEnd : 0;

    const renewalTime = calculateRenewalTimeDuringCheckout(
        subscription,
        cycle,
        modifiers.isCustomBilling,
        modifiers.isScheduledChargedLater,
        modifiers.isScheduledChargedImmediately
    );

    return {
        /** Unix timestamp (seconds) of the scheduled subscription start date */
        scheduledSubscriptionStartDate: currentSubscriptionPeriodEnd,
        visible: modifiers.isScheduled && isSubscriptionWithPeriodEnd,
        /** The next billing date  */
        renewalTime,
    };
}

export function createNextBillingItem(ctx: HeadlessCheckoutContextInner): NextBillingLineItem {
    return {
        type: NEXT_BILLING_LINE_ITEM_TYPE,
        ...formatNextBilling(ctx),
    };
}
