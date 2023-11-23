import { createSelector } from '@reduxjs/toolkit';

import type { InviteState } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';
import type { Invite, Maybe, MaybeNull } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { sortOn } from '@proton/pass/utils/fp/sort';

export const selectInvites = (state: State): InviteState => state.invites;

export const selectInviteByToken =
    (token: string) =>
    (state: State): Maybe<Invite> =>
        state.invites[token];

export const selectMostRecentInvite = createSelector(
    [selectInvites],
    (invites): MaybeNull<Invite> => first(Object.values(invites).sort(sortOn('createTime', 'DESC'))) ?? null
);
