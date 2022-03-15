import { UserModel } from '@proton/shared/lib/interfaces';

export const getShowNewDomainSection = ({ user, domain }: { user: UserModel; domain: string | undefined }) => {
    if (user.isSubUser || !domain) {
        return false;
    }

    return true;
};
