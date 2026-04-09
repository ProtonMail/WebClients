import type { OrganizationRole } from './OrganizationRole';

export interface UserPermission {
    Roles: OrganizationRole[];
    Permissions: string[];
}
