import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';
import { getIsSSOAccount } from '@proton/shared/lib/keys';

import { getPasswordReminderAccountType } from './getPasswordReminderAccountType';

export const getIsPasswordReminderAvailable = ({
    user,
    organization,
}: {
    user: UserModel;
    organization?: OrganizationExtended;
}) => {
    // SSO accounts are never eligible.
    if (getIsSSOAccount(user)) {
        return false;
    }

    // Read what we need up front: getIsSSOAccount is a type guard, so it narrows
    // `user` to `never` in the branches below it.
    const { isPrivate, isSelf } = user;

    // Org users (private and non-private alike) must be operating their own session
    // (not an admin via the org key).
    if (getPasswordReminderAccountType({ user, organization }) === 'organization') {
        return isSelf;
    }

    // Individual and family accounts: unchanged behavior.
    return isPrivate;
};
