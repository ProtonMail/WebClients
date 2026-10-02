import { createSelector } from '@reduxjs/toolkit';

import { toMap } from '@proton/shared/lib/helpers/object';

import type { Group } from '../../lib/groups/groups.types';
import type { Maybe } from '../../types';
import type { State } from '../types';

export const selectGroups = ({ groups }: State) => groups;

const selectGroupsByEmail = createSelector(selectGroups, (groups) => toMap(Object.values(groups), 'email'));

export const selectGroupByEmail = (email: string) => createSelector(selectGroupsByEmail, (groups): Maybe<Group> => groups[email]);
