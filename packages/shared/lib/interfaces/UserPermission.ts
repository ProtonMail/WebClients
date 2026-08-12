import type { OrganizationRole } from './OrganizationRole';

// These permissions have not added yet on the BE, it will be gradually added and moved to PERMISSIONS array
export const FE_PERMISSION_ONLY = [
    'account.dashboard.read',
    'account.organization_identity.read',
    'account.access_control.read',
    'account.organization_filter.read',
] as const;

export const PERMISSIONS = [
    'account.user.create',
    'account.user.read',
    'account.user.update',
    'account.user.delete',
    'account.group.create',
    'account.group.read',
    'account.group.update',
    'account.group.delete',
    'account.security_policy.create',
    'account.security_policy.read',
    'account.security_policy.update',
    'account.security_policy.delete',
    'account.data_retention.create',
    'account.data_retention.read',
    'account.data_retention.update',
    'account.data_retention.delete',
    'account.sso_config.create',
    'account.sso_config.read',
    'account.sso_config.update',
    'account.sso_config.delete',
    'account.activity_log.read',
    'account.activity_log.export',
    'account.domain.create',
    'account.domain.read',
    'account.domain.update',
    'account.domain.delete',
    'account.gateway.create',
    'account.gateway.read',
    'account.gateway.update',
    'account.gateway.delete',
    'account.shared_server.read',
    'account.shared_server.update',
    'account.always_on.read',
    ...FE_PERMISSION_ONLY,
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Every permission of the organization role of the current user, resolved to a boolean.
 * The map always contains every key of PERMISSIONS. Build it with getOrgPermissions.
 */
export type OrgPermissions = Record<Permission, boolean>;

export interface UserPermission {
    Roles: OrganizationRole[];
    Permissions: Permission[];
    ShowAdminRolesUI: boolean;
}
