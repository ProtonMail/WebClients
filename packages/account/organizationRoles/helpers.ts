import { c } from 'ttag';

import type { OrganizationRole, RoleAssignment } from '@proton/shared/lib/interfaces/OrganizationRole';
import {
    PREDEFINED_ROLE_NAME,
    ROLE_NAMES_REQUIRING_ORG_KEY,
    ROLE_SOURCE,
} from '@proton/shared/lib/interfaces/OrganizationRole';
import type { UnleashClient } from '@proton/unleash/UnleashClient';

const getRoleIdsBySource = (roles: RoleAssignment[], source: ROLE_SOURCE): Set<string> =>
    new Set(roles.filter(({ Source }) => Source === source).map(({ Role }) => Role.OrganizationRoleID));

export const getUserSourcedRoleIds = (roles: RoleAssignment[]): Set<string> =>
    getRoleIdsBySource(roles, ROLE_SOURCE.USER);

export const getGroupSourcedRoleIds = (roles: RoleAssignment[]): Set<string> =>
    getRoleIdsBySource(roles, ROLE_SOURCE.GROUP);

export const isOrgKeyRequired = (role: OrganizationRole): boolean => ROLE_NAMES_REQUIRING_ORG_KEY.has(role.Name);

export const isOwnerRole = (role: OrganizationRole): boolean => role.Name === PREDEFINED_ROLE_NAME.OWNER;

export const hasUserSourcedOwnerRole = (roles: RoleAssignment[]): boolean =>
    roles.some(({ Role, Source }) => Source === ROLE_SOURCE.USER && isOwnerRole(Role));

export const canManageOwnerRole = ({
    currentUserRoles,
    isEditingSelf,
    hasOrgKeyAccess,
}: {
    currentUserRoles: OrganizationRole[] | undefined;
    isEditingSelf: boolean;
    hasOrgKeyAccess: boolean;
}): boolean => (currentUserRoles?.some(isOwnerRole) ?? false) && !isEditingSelf && hasOrgKeyAccess;

/**
 * Syncing the owner role with the legacy `member.Role` is the default behaviour. `SyncOwnerRoleClientKillSwitch`
 * is the kill switch that falls back to the legacy `PUT core/v4/members/{id}/role` path, so an unreachable
 * Unleash (which reports every flag as disabled) keeps the default rather than silently reverting.
 */
export const isOwnerRoleSyncEnabled = (unleashClient: UnleashClient | undefined): boolean =>
    !unleashClient?.isEnabled('SyncOwnerRoleClientKillSwitch');

export const getTranslatedRoleName = (name: string): string => {
    switch (name) {
        case PREDEFINED_ROLE_NAME.OWNER:
            return c('Role').t`Organization Admin`;
        case PREDEFINED_ROLE_NAME.USER_ADMIN:
            return c('Role').t`User Admin`;
        case PREDEFINED_ROLE_NAME.SECURITY_ADMIN:
            return c('Role').t`Security Admin`;
        default:
            return name;
    }
};
