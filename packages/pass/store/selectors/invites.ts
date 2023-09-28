import { createSelector } from '@reduxjs/toolkit';

import { first } from '@proton/pass/utils/array';
import { sortOn } from '@proton/pass/utils/fp/sort';

import type { InviteState } from '../reducers';
import type { State } from '../types';

export const selectInvites = (state: State): InviteState => state.invites;

export const selectMostRecentInvite = createSelector([selectInvites], (invites) =>
    first(Object.values(invites).sort(sortOn('createTime', 'DESC')))
);
