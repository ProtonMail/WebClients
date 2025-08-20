import type { User } from '@proton/shared/lib/interfaces';
import { getIsBYOEAccount, getIsExternalAccount } from '@proton/shared/lib/keys';

export const getDriveDrawerPermissions = ({ user }: { user: User }) => {
    return {
        contacts: true,
        calendar: !getIsExternalAccount(user) || getIsBYOEAccount(user),
    };
};
