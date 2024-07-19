import type { User } from '@proton/shared/lib/interfaces';
import { UserType } from '@proton/shared/lib/interfaces';

export const getDriveDrawerPermissions = ({ user }: { user: User }) => {
    return {
        contacts: true,
        calendar: user.Type !== UserType.EXTERNAL,
    };
};
