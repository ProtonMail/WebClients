import { useEffect } from 'react';

import { type Action, type ThunkDispatch, createSelector } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { EnhancedGroup, RoleAssignment } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { type GroupsState, getGroupRoles, selectGroups } from './index';

type Result = {
    [key: string]: RoleAssignment[] | undefined;
};

const selector = createSelector([(state: GroupsState) => selectGroups(state)], (groupsState): Result => {
    const groups = groupsState.value || [];
    return Object.fromEntries(
        groups.map((group) => {
            return [group.ID, group.GroupOrganizationRoles];
        })
    );
});

export const useGroupRoles = ({ groups }: { groups: EnhancedGroup[] | undefined }) => {
    const dispatch = baseUseDispatch<ThunkDispatch<GroupsState, ProtonThunkArguments, Action>>();
    const value = baseUseSelector<GroupsState, Result>(selector);
    const enabled = useFlag('AdminRoleMVP');

    useEffect(() => {
        if (!enabled || !groups) {
            return;
        }
        groups.forEach((group) => {
            if (!group.roleState || group.roleState === 'stale') {
                dispatch(getGroupRoles({ group })).catch(noop);
            }
        });
    }, [groups, enabled]);

    return { value };
};
