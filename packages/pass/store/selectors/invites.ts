import { createSelector } from '@reduxjs/toolkit';

import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import type { InviteState } from '@proton/pass/store/reducers';
import { selectGroups } from '@proton/pass/store/selectors/groups';
import { selectFeatureFlag, selectPassPlan } from '@proton/pass/store/selectors/user';
import type { State } from '@proton/pass/store/types';
import type { Invite, Maybe, MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
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

/** Loading group invites is only needed if the user is a group owner.
 * Fetching every group members list to define if the user is a group
 * owner would be too long: limit to b2b and having at least one group. */
export const selectLoadGroupInvites = createSelector(
    [selectPassPlan, selectGroups, selectFeatureFlag(PassFeature.PassGroupInvitesV1)],
    (plan, groups, enabled): boolean => {
        if (!enabled) return false;
        const b2b = isBusinessPlan(plan);
        return b2b && !!groups?.length;
    }
);
