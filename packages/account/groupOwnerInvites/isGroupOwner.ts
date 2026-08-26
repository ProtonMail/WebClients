import { GROUP_MEMBER_PERMISSIONS, type Group, type GroupMembershipReturn } from '@proton/shared/lib/interfaces';

/**
 * Check if user is a group owner by finding groups that exist in both
 * the groups list and memberships with OWNER permissions
 */
export const isGroupOwner = (groups: Group[], memberships: GroupMembershipReturn[]): boolean => {
    const membershipsAmOwner = memberships.filter(({ Permissions }) => Permissions & GROUP_MEMBER_PERMISSIONS.OWNER);
    const groupsIdsAmOwner = new Set(membershipsAmOwner.map(({ GroupID }) => GroupID));
    return groups.some((group) => groupsIdsAmOwner.has(group.ID));
};
