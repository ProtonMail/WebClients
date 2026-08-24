import { createSelector } from '@reduxjs/toolkit';

import { toMap } from '@proton/shared/lib/helpers/object';

import type { Group, GroupId } from '../../lib/groups/groups.types';
import type { Maybe } from '../../types';
import type { State } from '../types';

export const selectGroups = ({ groups }: State) => groups;

export const selectGroupsByEmail = createSelector(selectGroups, (groups) => toMap(Object.values(groups), 'email'));

export const selectGroup =
    (groupId?: GroupId) =>
    ({ groups }: State): Maybe<Group> =>
        groupId ? groups[groupId] : undefined;

export const selectGroupByEmail = (email: string) => createSelector(selectGroupsByEmail, (groups): Maybe<Group> => groups[email]);
