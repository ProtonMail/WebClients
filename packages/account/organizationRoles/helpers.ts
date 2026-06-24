import { c } from 'ttag';

import type { OrganizationRole, RoleAssignment } from '@proton/shared/lib/interfaces/OrganizationRole';
import {
    PREDEFINED_ROLE_NAME,
    ROLE_NAMES_REQUIRING_ORG_KEY,
    ROLE_SOURCE,
} from '@proton/shared/lib/interfaces/OrganizationRole';

const getRoleIdsBySource = (roles: RoleAssignment[], source: ROLE_SOURCE): Set<string> =>
    new Set(roles.filter(({ Source }) => Source === source).map(({ Role }) => Role.OrganizationRoleID));

export const getUserSourcedRoleIds = (roles: RoleAssignment[]): Set<string> =>
    getRoleIdsBySource(roles, ROLE_SOURCE.USER);

export const getGroupSourcedRoleIds = (roles: RoleAssignment[]): Set<string> =>
    getRoleIdsBySource(roles, ROLE_SOURCE.GROUP);

export const isOrgKeyRequired = (role: OrganizationRole): boolean => ROLE_NAMES_REQUIRING_ORG_KEY.has(role.Name);

export const isOwnerRole = (role: OrganizationRole): boolean => role.Name === PREDEFINED_ROLE_NAME.OWNER;

export const isLegacyOrgAdminState = (isLegacyOrgAdmin: boolean, adminRolesIds: Set<string>): boolean =>
    isLegacyOrgAdmin && adminRolesIds.size === 0;

export const getTranslatedRoleName = (name: string): string => {
    switch (name) {
        case PREDEFINED_ROLE_NAME.OWNER:
            return c('Role').t`Owner`;
        case PREDEFINED_ROLE_NAME.USER_ADMIN:
            return c('Role').t`User Admin`;
        case PREDEFINED_ROLE_NAME.SECURITY_ADMIN:
            return c('Role').t`Security Admin`;
        default:
            return name;
    }
};

export const getTranslatedRoleDescription = (name: string): string => {
    switch (name) {
        case PREDEFINED_ROLE_NAME.OWNER:
            return c('Role description').t`Manage all users, groups, security, billing, and system configurations.`;
        case PREDEFINED_ROLE_NAME.USER_ADMIN:
            return c('Role description')
                .t`Manage users, groups, and storage for all members, assign roles, and allocate licenses.`;
        case PREDEFINED_ROLE_NAME.SECURITY_ADMIN:
            return c('Role description')
                .t`Configure security policies, data retention, and VPN infrastructure, and manage audit logs.`;
        default:
            return '';
    }
};
