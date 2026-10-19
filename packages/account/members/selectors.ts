import { createSelector } from '@reduxjs/toolkit';

import { getIsMemberDisabled } from '@proton/shared/lib/keys/memberHelper';

import { selectMembers } from './index';
import { getHasPausedMemberRoleAssignment } from './memberUnprivatization';

export const selectDisabledMembers = createSelector(selectMembers, (membersState) => {
    return membersState.value?.filter(getIsMemberDisabled) || [];
});

export const selectMembersWithPausedRoleAssignment = createSelector(selectMembers, (membersState) => {
    return membersState.value?.filter((member) => getHasPausedMemberRoleAssignment({ member })) || [];
});
