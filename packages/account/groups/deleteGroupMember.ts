import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { deleteGroupMember as deleteGroupMemberApi } from '@proton/shared/lib/api/groups';
import type { Group, GroupMember, Member } from '@proton/shared/lib/interfaces';

import { type GroupMembersState, groupMembersActions } from '../groupMembers';
import { type MembersState, invalidateMemberRoles } from '../members';
import { type GroupsState, invalidateGroupRoles } from './index';

type RequiredState = GroupsState & GroupMembersState & MembersState;

export const deleteGroupMemberThunk = ({
    group,
    groupMember,
    member,
}: {
    group: Pick<Group, 'ID'>;
    groupMember: Pick<GroupMember, 'ID'>;
    member?: Member;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _getState, extra) => {
        await extra.api(deleteGroupMemberApi(groupMember.ID));

        dispatch(groupMembersActions.deleteGroupMember({ groupID: group.ID, memberID: groupMember.ID }));
        dispatch(invalidateGroupRoles({ group }));

        if (member) {
            dispatch(invalidateMemberRoles({ member }));
        }
    };
};
