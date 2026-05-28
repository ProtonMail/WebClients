import type { OrganizationRole } from './OrganizationRole';

export const PERMISSIONS = [
    'account.user.create',
    'account.user.read',
    'account.user.update',
    'account.user.delete',
    'account.group.create',
    'account.group.read',
    'account.group.update',
    'account.group.delete',
    'account.organization_key.read',
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
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export interface UserPermission {
    Roles: OrganizationRole[];
    Permissions: Permission[];
}
