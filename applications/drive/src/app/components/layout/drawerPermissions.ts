import { User, UserType } from '@proton/shared/lib/interfaces';

export const getDriveDrawerPermissions = ({ user }: { user: User }) => {
    return {
        contacts: true,
        calendar: user.Type !== UserType.EXTERNAL,
    };
};
