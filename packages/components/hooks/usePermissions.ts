import { USER_ROLES, PERMISSIONS } from '@proton/shared/lib/constants';
import { Organization, UserModel } from '@proton/shared/lib/interfaces';

import { useUser } from './useUser';
import { useOrganization } from './useOrganization';

const { MEMBER_ROLE, ADMIN_ROLE, FREE_ROLE } = USER_ROLES;
const { MEMBER, ADMIN, FREE, MULTI_USERS, PAID, PAID_MAIL, PAID_VPN, UPGRADER, NOT_SUB_USER } = PERMISSIONS;

const ROLES = {
    [MEMBER_ROLE]: MEMBER,
    [ADMIN_ROLE]: ADMIN,
    [FREE_ROLE]: FREE,
};

export const hasUpgraderPermission = (user: UserModel) => user.canPay;
export const hasNotSubUserPermission = (user: UserModel) => !user.isSubUser;
export const hasMultiUsersPermission = (organization: Organization) => (organization.MaxMembers || 0) > 1;
export const hasPaidPermission = (user: UserModel) => user.isPaid;
export const hasPaidMailPemission = (user: UserModel) => hasPaidPermission(user) && user.hasPaidMail;
export const hasPaidVpnPermission = (user: UserModel) => hasPaidPermission(user) && user.hasPaidVpn;

const usePermissions = () => {
    const permissions: PERMISSIONS[] = [];
    const [user] = useUser();
    const [organization] = useOrganization();

    permissions.push(ROLES[user.Role]);

    if (hasUpgraderPermission(user)) {
        permissions.push(UPGRADER);
    }

    if (hasNotSubUserPermission(user)) {
        permissions.push(NOT_SUB_USER);
    }

    if (hasMultiUsersPermission(organization || {})) {
        permissions.push(MULTI_USERS);
    }

    if (hasPaidPermission(user)) {
        permissions.push(PAID);
    }

    if (hasPaidMailPemission(user)) {
        permissions.push(PAID_MAIL);
    }

    if (hasPaidVpnPermission(user)) {
        permissions.push(PAID_VPN);
    }

    return permissions;
};

export default usePermissions;
