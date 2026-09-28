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

    // Whoever is reminded has to be the one who can act on it, so the session must be the
    // account holder's own. `isSelf` is false both for an admin signed in through the
    // organization key and for a trusted contact signed in through emergency access —
    // neither knows the password we'd be asking them to check, and an org account is not
    // the only kind that someone else can hold a session on.
    if (!isSelf) {
        return false;
    }

    // Org users (private and non-private alike) are eligible on their own session: unlike
    // individuals, a non-private member still signs in with a password of their own.
    if (getPasswordReminderAccountType({ user, organization }) === 'organization') {
        return true;
    }

    // Individual and family accounts: unchanged behavior.
    return isPrivate;
};
