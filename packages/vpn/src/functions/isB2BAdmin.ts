import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

export const isB2BAdmin = ({
    user,
    organization,
    isVpnB2B,
}: {
    user: UserModel;
    organization?: OrganizationExtended;
    isVpnB2B: boolean;
}) => {
    const isAdmin = user.isAdmin && user.isSelf;
    const canHaveOrganization = !user.isMember && !!organization && isAdmin;

    return canHaveOrganization && isVpnB2B;
};
