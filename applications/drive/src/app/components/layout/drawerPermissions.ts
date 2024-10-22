import type { User } from '@proton/shared/lib/interfaces';
import { getIsExternalAccount } from '@proton/shared/lib/keys';

export const getDriveDrawerPermissions = ({ user }: { user: User }) => {
    return {
        contacts: true,
        calendar: !getIsExternalAccount(user),
    };
};
