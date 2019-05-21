import { useUser, useSubscription } from 'react-components';
import { USER_ROLES, PERMISSIONS } from 'proton-shared/lib/constants';

const { MEMBER_ROLE, ADMIN_ROLE, FREE_ROLE } = USER_ROLES;
const { MEMBER, ADMIN, FREE, MULTI_USERS, PAID, PAID_MAIL, PAID_VPN, UPGRADER } = PERMISSIONS;

const ROLES = {
    [MEMBER_ROLE]: MEMBER,
    [ADMIN_ROLE]: ADMIN,
    [FREE_ROLE]: FREE
};

const usePermissions = () => {
    const permissions = [];
    const [{ Role, isPaid, hasPaidMail, hasPaidVpn }] = useUser();
    const [{ MaxMembers = 0 } = {}] = useSubscription();

    permissions.push(ROLES[Role]);

    if ([FREE_ROLE, ADMIN_ROLE].includes(Role)) {
        permissions.push(UPGRADER);
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
