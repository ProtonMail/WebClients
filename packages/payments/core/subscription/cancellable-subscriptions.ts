import { hasLifetimeCoupon } from '@proton/shared/lib/payments/coupons';
import { isSubscriptionRenewEnabled } from '@proton/shared/lib/payments/subscription/helpers/renew';

import { isCancellableOnlyViaSupport } from './helpers';
import type { MaybeFreeSubscription, Subscription } from './interface';

export const canCancelSubscription = (subscription: MaybeFreeSubscription): boolean =>
    isSubscriptionRenewEnabled(subscription) && !isCancellableOnlyViaSupport(subscription);

export const getCancellableSubscriptions = (subscriptions: Subscription[]): Subscription[] =>
    subscriptions.filter((subscription) => !hasLifetimeCoupon(subscription) && canCancelSubscription(subscription));

export const isCancelSubscriptionSectionAvailable = (allSubscriptions: Subscription[]): boolean =>
    getCancellableSubscriptions(allSubscriptions).length > 0;
