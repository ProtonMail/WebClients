import { USER_ROLES, PERMISSIONS } from '@proton/shared/lib/constants';
import { useUser } from './useUser';
import { useOrganization } from './useOrganization';

const { MEMBER_ROLE, ADMIN_ROLE, FREE_ROLE } = USER_ROLES;
const { MEMBER, ADMIN, FREE, MULTI_USERS, PAID, PAID_MAIL, PAID_VPN, UPGRADER, NOT_SUB_USER } = PERMISSIONS;

const ROLES = {
    [MEMBER_ROLE]: MEMBER,
    [ADMIN_ROLE]: ADMIN,
    [FREE_ROLE]: FREE,
};

const usePermissions = () => {
    const permissions: PERMISSIONS[] = [];
    const [{ Role, isPaid, hasPaidMail, hasPaidVpn, canPay, isSubUser }] = useUser();
    const [{ MaxMembers = 0 } = {}] = useOrganization();

    permissions.push(ROLES[Role]);

    if (canPay) {
        permissions.push(UPGRADER);
    }

    if (!isSubUser) {
        permissions.push(NOT_SUB_USER);
    }

    if (MaxMembers > 1) {
        permissions.push(MULTI_USERS);
    }

    if (isPaid) {
        permissions.push(PAID);

        if (hasPaidMail) {
            permissions.push(PAID_MAIL);
        }

        if (hasPaidVpn) {
            permissions.push(PAID_VPN);
        }
    }

    return permissions;
};

export default usePermissions;
