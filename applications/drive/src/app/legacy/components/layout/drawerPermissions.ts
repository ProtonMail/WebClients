import type { User } from '@proton/shared/lib/interfaces/User';
import { getIsBYOEAccount, getIsExternalAccount } from '@proton/shared/lib/keys/accountType';

export const getDriveDrawerPermissions = ({ user }: { user: User }) => {
    return {
        contacts: true,
        calendar: !getIsExternalAccount(user) || getIsBYOEAccount(user),
    };
};
