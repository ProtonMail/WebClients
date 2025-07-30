import type { UserModel } from '@proton/shared/lib/interfaces';
import { isPrivate, isSelf } from '@proton/shared/lib/user/helpers';

// Route that is in the email links
export const getTrustedContactRoute = (prefix = '') => {
    return `${prefix}/trusted-contacts`;
};

export const getIsIncomingDelegatedAccessAvailable = (user: UserModel) => {
    // Incoming delegated access, need to have keys setup and not impersonating
    return user.Keys.length > 0 && isSelf(user);
};

export const getIsOutgoingDelegatedAccessAvailable = (user: UserModel) => {
    // Outgoing delegated access, need to manage your own keys (isPrivate)
    return getIsIncomingDelegatedAccessAvailable(user) && isPrivate(user);
};
