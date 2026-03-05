import type { Reducer } from 'redux';

import type { Group, GroupId } from '@proton/pass/lib/groups/groups.types';
import { getGroup, getGroups } from '@proton/pass/store/actions/creators/groups';

export type GroupsState = Record<GroupId, Group>;

const reducer: Reducer<GroupsState> = (state = {}, action) => {
    if (getGroups.success.match(action)) {
        const newState = { ...state };
        action.payload.groups.forEach((group) => (newState[group.groupId] = group));
        return newState;
    }

    if (getGroup.success.match(action)) {
        const group = action.payload;
        // If a group has been link to an org before, keep that ref
        const organizationId = state[group.groupId]?.organizationId ?? null;
        return { ...state, [group.groupId]: { ...group, organizationId } };
    }

    return state;
};

export default reducer;
