import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';
import { getIsSSOAccount } from '@proton/shared/lib/keys';
import type { UnleashClient } from '@proton/unleash/UnleashClient';

import { getPasswordReminderAccountType } from './getPasswordReminderAccountType';

export const getIsPasswordReminderAvailable = ({
    unleashClient,
    user,
    organization,
}: {
    unleashClient: UnleashClient;
    user: UserModel;
    organization?: OrganizationExtended;
}) => {
    // Overall feature gate; SSO accounts are never eligible.
    if (!unleashClient.isEnabled('PasswordReminders') || getIsSSOAccount(user)) {
        return false;
    }

    // Read what we need up front: getIsSSOAccount is a type guard, so it narrows
    // `user` to `never` in the branches below it.
    const { isPrivate, isSelf } = user;

    const accountType = getPasswordReminderAccountType({ user, organization });

    // Org users (private and non-private alike) need the additional org flag
    // and must be operating their own session (not an admin via the org key).
    if (accountType === 'organization') {
        return unleashClient.isEnabled('PasswordRemindersOrg') && isSelf;
    }

    // Individual and family accounts: unchanged behavior.
    return isPrivate;
};
