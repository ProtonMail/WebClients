import { createSelector } from '@reduxjs/toolkit';

import { getIsMemberDisabled } from '@proton/shared/lib/keys/memberHelper';
import { getHasPausedRoleAssignment } from '@proton/shared/lib/organization/helper';

import { selectMembers } from './index';

export const selectDisabledMembers = createSelector(selectMembers, (membersState) => {
    return membersState.value?.filter(getIsMemberDisabled) || [];
});

export const selectMembersWithPausedRoleAssignment = createSelector(selectMembers, (membersState) => {
    return membersState.value?.filter((member) => getHasPausedRoleAssignment({ member })) || [];
});
