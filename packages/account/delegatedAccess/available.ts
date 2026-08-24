import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces';
import { isAdmin, isPrivate, isSelf } from '@proton/shared/lib/user/helpers';

/**
 * Delegated access is only wired up in Account because:
 * 1 emergency contacts requires switch account
 * 2 recovery contacts requires routes which don't exist in the VPN API bundle, e.g.
 *   account/v1/access/${outgoingDelegatedAccess.DelegatedAccessID}/recover, which show up in ReactivateKeysModal
 *
 * Everything derived from delegated access (recovery contacts, emergency access) has to be hidden in the apps where
 * it's not supported, otherwise it shows up as an unreachable option, e.g. in the recovery score and safety review.
 */
export const getIsDelegatedAccessSupportedInApp = (app: APP_NAMES | undefined) => {
    return app === APPS.PROTONACCOUNT;
};

export const getIsIncomingDelegatedAccessAvailable = (user: User) => {
    // Incoming delegated access, need to have keys setup and not impersonating
    return user.Keys.length > 0 && isSelf(user);
};

export const getIsOutgoingDelegatedAccessAvailable = (user: User | undefined) => {
    // Outgoing delegated access, need to manage your own keys (isPrivate or be admin)
    return !!user && getIsIncomingDelegatedAccessAvailable(user) && (isPrivate(user) || isAdmin(user));
};
