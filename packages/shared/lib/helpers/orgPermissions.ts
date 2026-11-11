import { USER_ROLES } from '../constants';
import type { User } from '../interfaces/User';
import type { OrgPermissions } from '../interfaces/UserPermission';
import { isAdmin } from '../user/helpers';

export function hasNoOrgPermissions(permissions: OrgPermissions): boolean {
    return Object.values(permissions).every((permission) => !permission);
}

export function getCanUpdateBilling(user: User, permissions: OrgPermissions | null): boolean {
    if (user.Role === USER_ROLES.FREE_ROLE) {
        return true;
    }
    if (permissions === null) {
        return false;
    }
    const isAwaitingPermissionsAfterUpgrade = isAdmin(user) && hasNoOrgPermissions(permissions);
    return permissions['payment.billing.update'] || isAwaitingPermissionsAfterUpgrade;
}
