import { createSelector } from '@reduxjs/toolkit';

import { isBusinessPlan } from '../../lib/organization/helpers';
import type { Invite, Maybe, MaybeNull } from '../../types';
import { PassFeature } from '../../types/api/features';
import { first } from '../../utils/array/first';
import { sortOn } from '../../utils/fp/sort';
import type { InviteState } from '../reducers';
import type { State } from '../types';
import { selectFeatureFlag, selectPassPlan } from './user';

export const selectInvites = (state: State): InviteState => state.invites;

export const selectInviteByToken =
    (token: string) =>
    (state: State): Maybe<Invite> =>
        state.invites[token];

export const selectMostRecentInvite = createSelector(
    [selectInvites],
    (invites): MaybeNull<Invite> => first(Object.values(invites).sort(sortOn('createTime', 'DESC'))) ?? null
);

export const selectLoadGroupInvites = createSelector(
    [selectPassPlan, selectFeatureFlag(PassFeature.PassGroupInvitesV1)],
    (plan, enabled): boolean => enabled && isBusinessPlan(plan)
);
