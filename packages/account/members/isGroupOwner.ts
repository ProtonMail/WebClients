import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { GROUP_MEMBER_PERMISSIONS, type Group, type GroupMembershipReturn } from '@proton/shared/lib/interfaces';

import type { GroupMembershipsState } from '../groupMemberships';
import { groupMembershipsThunk } from '../groupMemberships';
import type { GroupsState } from '../groups';
import { groupThunk } from '../groups';

/**
 * Check if user is a group owner by finding groups that exist in both
 * the groups list and memberships with OWNER permissions
 */
export const isGroupOwner = (groups: Group[], memberships: GroupMembershipReturn[]): boolean => {
    const membershipsAmOwner = memberships.filter(({ Permissions }) => Permissions & GROUP_MEMBER_PERMISSIONS.OWNER);
    const groupsIdsAmOwner = new Set(membershipsAmOwner.map(({ GroupID }) => GroupID));
    return groups.some((group) => groupsIdsAmOwner.has(group.ID));
};

export interface IsGroupOwnerState extends GroupsState, GroupMembershipsState {}

/**
 * Thunk to check if the current user is a group owner
 */
export const isGroupOwnerThunk = (): ThunkAction<
    Promise<boolean>,
    IsGroupOwnerState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const [groups, memberships] = await Promise.all([dispatch(groupThunk()), dispatch(groupMembershipsThunk())]);
        return isGroupOwner(groups, memberships);
    };
};
