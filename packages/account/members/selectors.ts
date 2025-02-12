import { createSelector } from '@reduxjs/toolkit';

import { getIsMemberDisabled } from '@proton/shared/lib/keys/memberHelper';

import { selectMembers } from './index';

export const selectDisabledMembers = createSelector(selectMembers, (membersState) => {
    return membersState.value?.filter(getIsMemberDisabled) || [];
});
