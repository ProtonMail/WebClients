import type { User } from '@proton/shared/lib/interfaces';
import { isAdmin, isPrivate, isSelf } from '@proton/shared/lib/user/helpers';

export const getIsIncomingDelegatedAccessAvailable = (user: User) => {
    // Incoming delegated access, need to have keys setup and not impersonating
    return user.Keys.length > 0 && isSelf(user);
};

export const getIsOutgoingDelegatedAccessAvailable = (user: User) => {
    // Outgoing delegated access, need to manage your own keys (isPrivate or be admin)
    return getIsIncomingDelegatedAccessAvailable(user) && (isPrivate(user) || isAdmin(user));
};
