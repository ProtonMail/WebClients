import { isUpcomingSubscriptionUnpaid } from '@proton/payments/core/subscription/helpers';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/interface';
import { isPaidSubscription } from '@proton/payments/core/type-guards';

export function hasIntentionalScheduledModification(subscription: MaybeFreeSubscription | null): boolean {
    if (!isPaidSubscription(subscription)) {
        return false;
    }

    const upcoming = subscription.UpcomingSubscription;
    if (!upcoming) {
        return false;
    }

    return !isUpcomingSubscriptionUnpaid(upcoming);
}
