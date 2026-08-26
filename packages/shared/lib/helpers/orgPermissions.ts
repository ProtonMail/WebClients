import type { OrgPermissions } from '../interfaces';

export function hasNoOrgPermissions(permissions: OrgPermissions): boolean {
    return Object.values(permissions).every((permission) => !permission);
}
