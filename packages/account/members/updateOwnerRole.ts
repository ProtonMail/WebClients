import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { Api, Member } from '@proton/shared/lib/interfaces';

import { type OrganizationRolesState, organizationRolesThunk } from '../organizationRoles';
import { isOwnerRole } from '../organizationRoles/helpers';
import { type MembersState, updateMemberRoleByIds } from './index';

export const getRequiredOwnerRoleId = (): ThunkAction<
    Promise<string>,
    OrganizationRolesState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const organizationRoles = await dispatch(organizationRolesThunk());
        const ownerRoleId = organizationRoles.find(isOwnerRole)?.OrganizationRoleID;
        if (!ownerRoleId) {
            throw new Error('Missing owner role');
        }
        return ownerRoleId;
    };
};

/**
 * Keeps the owner role assignment in sync with the legacy `member.Role`.
 */
export const updateOwnerRole = ({
    member,
    makeAdmin,
    api,
}: {
    member: Member;
    makeAdmin: boolean;
    api: Api;
}): ThunkAction<Promise<boolean>, MembersState & OrganizationRolesState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _getState, extra) => {
        if (!extra.unleashClient?.isEnabled('SyncOwnerRoleClient')) {
            return false;
        }
        const ownerRoleId = await dispatch(getRequiredOwnerRoleId());
        const { changed } = await dispatch(
            updateMemberRoleByIds({
                member,
                currentRoleIds: makeAdmin ? new Set() : new Set([ownerRoleId]),
                desiredRoleIds: makeAdmin ? new Set([ownerRoleId]) : new Set(),
                api,
            })
        );
        return changed;
    };
};
