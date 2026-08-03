import { useEffect } from 'react';

import { type Action, type ThunkDispatch, createSelector } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { EnhancedMember, RoleAssignment } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { AdminRolesUIState, useAdminRolesUI } from '../userPermissions/hooks';
import { type MembersState, getMemberRoles, selectMembers } from './index';

type Result = {
    [key: string]: RoleAssignment[] | undefined;
};

const selector = createSelector([(state: MembersState) => selectMembers(state)], (membersState): Result => {
    const members = membersState.value || [];
    return Object.fromEntries(
        members.map((member) => {
            return [member.ID, member.UserOrganizationRoles];
        })
    );
});

export const useMemberRoles = ({ members }: { members: EnhancedMember[] | undefined }) => {
    const dispatch = baseUseDispatch<ThunkDispatch<MembersState, ProtonThunkArguments, Action>>();
    const value = baseUseSelector<MembersState, Result>(selector);
    const [adminRolesUIState] = useAdminRolesUI();

    useEffect(() => {
        if (adminRolesUIState === AdminRolesUIState.Hidden || !members) {
            return;
        }
        members.forEach((member) => {
            if (member.roleState === 'initial' || member.roleState === 'stale') {
                dispatch(getMemberRoles({ member })).catch(noop);
            }
        });
    }, [members, adminRolesUIState]);

    return { value };
};
