import { createSelector } from '@reduxjs/toolkit';

import { GROUP_MEMBER_STATE } from '@proton/shared/lib/interfaces';
import type { GroupMember } from '@proton/shared/lib/interfaces/GroupMember';

import { selectGroupMembers } from '../groupMembers';
import { selectGroups } from '../groups';
import { getIsScimGroup, getIsScimGroupPendingKeys } from '../groups/groupFlags';
import { selectJoinedUnprivatizationState } from '../members/unprivatizeMembers';

/** Members awaiting manual approval (unprivatization). */
export const selectPendingScimUsers = createSelector(selectJoinedUnprivatizationState, (joinedState) =>
    joinedState.approval.map(({ member }) => member)
);

/** Pending-admin members keyed by group ID. */
export const selectPendingScimMembersByGroup = createSelector(
    selectGroups,
    selectGroupMembers,
    (groupsState, groupMembersState) => {
        const pendingMembersByGroup: Record<string, GroupMember[]> = {};
        for (const group of groupsState.value ?? []) {
            const members = groupMembersState[group.ID]?.value;
            if (members) {
                pendingMembersByGroup[group.ID] = Object.values(members).filter(
                    (m) => m.State === GROUP_MEMBER_STATE.PENDING_ADMIN
                );
            }
        }
        return pendingMembersByGroup;
    }
);

/**
 * Groups that need finalizing during SCIM setup: newly synced groups still missing keys, plus
 * existing SCIM groups that have keys but gained pending-admin members.
 */
export const selectPendingScimGroups = createSelector(
    selectGroups,
    selectPendingScimMembersByGroup,
    (groupsState, pendingMembersByGroup) => {
        const groups = groupsState.value ?? [];
        const newGroups = groups.filter(getIsScimGroupPendingKeys);
        const updatedGroups = groups.filter(
            (group) =>
                getIsScimGroup(group) && group.Address.HasKeys && (pendingMembersByGroup[group.ID]?.length ?? 0) > 0
        );
        return [...newGroups, ...updatedGroups];
    }
);
