import { createSelector } from '@reduxjs/toolkit';

import type { Group, GroupId } from '@proton/pass/lib/groups/groups.types';
import type { State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import { toMap } from '@proton/shared/lib/helpers/object';

export const selectGroups = ({ groups }: State) => groups;

export const selectGroupsByEmail = createSelector(selectGroups, (groups) => toMap(Object.values(groups), 'email'));

export const selectGroup =
    (groupId?: GroupId) =>
    ({ groups }: State): Maybe<Group> =>
        groupId ? groups[groupId] : undefined;

export const selectGroupByEmail = (email: string) => createSelector(selectGroupsByEmail, (groups): Maybe<Group> => groups[email]);
