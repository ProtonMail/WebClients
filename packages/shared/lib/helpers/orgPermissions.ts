import type { OrgPermissions } from '../interfaces/UserPermission';

export function hasNoOrgPermissions(permissions: OrgPermissions): boolean {
    return Object.values(permissions).every((permission) => !permission);
}
