import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getUserPermissions } from '@proton/shared/lib/api/userPermissions';
import { PERMISSIONS, type Permission, type UserPermission } from '@proton/shared/lib/interfaces';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import { type UserState, selectUser } from '../user';

const name = 'userPermissions';

export interface UserPermissionsState extends UserState {
    [name]: ModelState<UserPermission>;
}

type SliceState = UserPermissionsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectUserPermissions = (state: UserPermissionsState) => state[name];
// @todo: remove the dependency of user state when legacy permission system is retired
export const selectOrgPermissions = createSelector(
    [
        (state: UserPermissionsState) => selectUser(state).value,
        (state: UserPermissionsState) => selectUserPermissions(state).value,
    ],
    (user, userPermissions): [Record<Permission, boolean> | null, boolean] => {
        if (!user || !userPermissions) {
            return [null, true];
        }
        const isLegacyAdmin = user.isAdmin && user.isSelf;
        const perms = new Set(userPermissions.Permissions);
        const entries = PERMISSIONS.map((p) => [p, isLegacyAdmin || perms.has(p)] as const);
        return [Object.fromEntries(entries) as Record<Permission, boolean>, false];
    }
);
// Derive permissions from user state only, serve as a fallback when roles and permissions are not yet enabled
// @todo: remove this when AdminRoleMVP flag is removed
export const selectOrgPermissionsLegacy = createSelector(
    [(state: UserPermissionsState) => selectUser(state).value],
    (user): [Record<Permission, boolean> | null, boolean] => {
        if (!user) {
            return [null, true];
        }
        const isLegacyAdmin = user.isAdmin && user.isSelf;
        const entries = PERMISSIONS.map((p) => [p, isLegacyAdmin] as const);
        return [Object.fromEntries(entries) as Record<Permission, boolean>, false];
    }
);

const modelThunk = createAsyncModelThunk<Model, UserPermissionsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        const flag = extraArgument.unleashClient?.isEnabled('AdminRoleMVP') ?? false;
        if (!flag) {
            return { Roles: [], Permissions: [] };
        }
        const Permission = await extraArgument.api<UserPermission>(getUserPermissions());
        return Permission;
    },
    previous: previousSelector(selectUserPermissions),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const userPermissionsReducer = { [name]: slice.reducer };
export const userPermissionsThunk = modelThunk.thunk;
