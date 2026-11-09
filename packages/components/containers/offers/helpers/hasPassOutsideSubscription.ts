import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { hasPassLifetime, hasPassViaSimpleLogin } from '@proton/shared/lib/user/helpers';

/**
 * Pass Lifetime and Pass-via-SimpleLogin accounts get Pass from a user flag rather than their Proton
 * subscription, so they can look free (or like a plain Mail Plus or Unlimited subscriber) to offer rules.
 */
export function hasPassOutsideSubscription(user: UserModel) {
    return hasPassLifetime(user) || hasPassViaSimpleLogin(user);
}
