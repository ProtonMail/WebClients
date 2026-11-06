import { differenceInHours, fromUnixTime } from 'date-fns';

import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

// Like the post-signup one dollar offer, nobody sees the campaign within this many hours of signing up or
// of starting to pay.
export const BLACK_FRIDAY_2026_MIN_AGE_HOURS = 5;

const isOldEnough = (createTime: number) => {
    return differenceInHours(new Date(), fromUnixTime(createTime)) >= BLACK_FRIDAY_2026_MIN_AGE_HOURS;
};

/** The free-user offers wait until the account is at least the minimum age. */
export function isAccountOldEnoughForBlackFriday2026(user: UserModel) {
    return isOldEnough(user.CreateTime);
}

/**
 * The paid upgrade offers wait until the subscription is at least the minimum age. The backend keeps the
 * first subscription's CreateTime through same-currency plan changes and renewals, so this is the time since
 * the user started paying, not since their last change.
 */
export function isSubscriptionOldEnoughForBlackFriday2026(subscription: Subscription) {
    return isOldEnough(subscription.CreateTime);
}
