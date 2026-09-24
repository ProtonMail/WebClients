import { useEffect } from 'react';

import { type Action, type ThunkDispatch, createSelector } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { EnhancedMember, RoleAssignment } from '@proton/shared/lib/interfaces';

import { AdminRolesUIState, useAdminRolesUI } from '../userPermissions/hooks';
import { type MembersState, getMemberRolesBatch, selectMembers } from './index';

type Result = {
    [key: string]: RoleAssignment[] | undefined;
};

type RequiresOrgKeyPromotionResult = {
    [key: string]: boolean | undefined;
};

const selector = createSelector([(state: MembersState) => selectMembers(state)], (membersState): Result => {
    const members = membersState.value || [];
    return Object.fromEntries(
        members.map((member) => {
            return [member.ID, member.UserOrganizationRoles];
        })
    );
});

const requiresOrgKeyPromotionSelector = createSelector(
    [(state: MembersState) => selectMembers(state)],
    (membersState): RequiresOrgKeyPromotionResult => {
        const members = membersState.value || [];
        return Object.fromEntries(
            members.map((member) => {
                return [member.ID, member.requiresOrgKeyPromotion];
            })
        );
    }
);

export const useMemberRoles = ({ members }: { members: EnhancedMember[] | undefined }) => {
    const dispatch = baseUseDispatch<ThunkDispatch<MembersState, ProtonThunkArguments, Action>>();
    const value = baseUseSelector<MembersState, Result>(selector);
    const requiresOrgKeyPromotionMap = baseUseSelector<MembersState, RequiresOrgKeyPromotionResult>(
        requiresOrgKeyPromotionSelector
    );
    const [adminRolesUIState] = useAdminRolesUI();

    useEffect(() => {
        if (adminRolesUIState === AdminRolesUIState.Hidden || !members) {
            return;
        }
        // This action will keep running after the hook is unmounted on purpose, otherwise we need to reverse
        // the 'pending' state to 'stale' so that the members are picked up again on next run.
        void dispatch(getMemberRolesBatch({ members }));
    }, [members, adminRolesUIState]);

    return { value, requiresOrgKeyPromotionMap };
};
