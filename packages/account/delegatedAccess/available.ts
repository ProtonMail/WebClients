import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces/User';
import { isAdmin, isPrivate, isSelf } from '@proton/shared/lib/user/helpers';

/**
 * Delegated access support is split in two because the apps that embed it can deliver different parts of it:
 *
 * - Full support (`getIsDelegatedAccessSupportedInApp`) adds accessing someone's account as their emergency contact,
 *   which requires switch account. It's only wired up in Account.
 * - Outgoing support (`getIsOutgoingDelegatedAccessSupportedInApp`) covers everything else: your own emergency contacts
 *   and recovery contacts, recovering your data with a recovery contact, and being someone's emergency or recovery
 *   contact. Account and the lite app, embedded in mobile apps, support it, but not VPN settings: the recovery routes
 *   don't exist in the VPN API bundle, e.g.
 *   account/v1/access/${outgoingDelegatedAccess.DelegatedAccessID}/recover, which show up in ReactivateKeysModal
 *
 * Everything derived from delegated access (recovery contacts, emergency access) has to be hidden in the apps where
 * it's not supported, otherwise it shows up as an unreachable option, e.g. in the recovery score and safety review.
 */
export const getIsDelegatedAccessSupportedInApp = (app: APP_NAMES | undefined) => {
    return app === APPS.PROTONACCOUNT;
};

export const getIsOutgoingDelegatedAccessSupportedInApp = (app: APP_NAMES | undefined) => {
    return app === APPS.PROTONACCOUNT || app === APPS.PROTONACCOUNTLITE;
};

export const getIsIncomingDelegatedAccessAvailable = (user: User) => {
    // Incoming delegated access, need to have keys setup and not impersonating
    return user.Keys.length > 0 && isSelf(user);
};

export const getIsOutgoingDelegatedAccessAvailable = (user: User | undefined) => {
    // Outgoing delegated access, need to manage your own keys (isPrivate or be admin)
    return !!user && getIsIncomingDelegatedAccessAvailable(user) && (isPrivate(user) || isAdmin(user));
};
