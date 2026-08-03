import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { getUserPermissions } from '@proton/shared/lib/api/userPermissions';
import { PERMISSIONS, type Permission, type User, type UserPermission } from '@proton/shared/lib/interfaces';

import { serverEvent } from '../eventLoop';
import { isOwnerRole } from '../organizationRoles/helpers';
import { type UserState, userFulfilled, userThunk } from '../user';

const name = 'userPermissions';

export interface UserPermissionsState extends UserState {
    [name]: ModelState<UserPermission & { permissions: Record<Permission, boolean>; role: number }>;
}

type SliceState = UserPermissionsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectUserPermissions = (state: UserPermissionsState) => state[name];

export const getOrgPermissions = (
    permissions: UserPermission['Permissions'],
    grantAllPermissions: boolean
): Record<Permission, boolean> => {
    const permissionsSet = new Set(permissions);
    // @todo: remove the dependency of user state when legacy permission system is retired
    const entries = PERMISSIONS.map((p) => [p, grantAllPermissions || permissionsSet.has(p)] as const);
    return Object.fromEntries(entries) as Record<Permission, boolean>;
};

const modelThunk = createAsyncModelThunk<Model, UserPermissionsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument, dispatch }) => {
        const user = await dispatch(userThunk());
        // A runtime unleash toggle won't reflect until the next refetch, but that's fine in practice.
        const flag = extraArgument.unleashClient?.isEnabled('AdminRoleMVP') ?? false;
        const isLegacyAdmin = user.isAdmin && user.isSelf;
        if (!flag) {
            const permissions = getOrgPermissions([], isLegacyAdmin);
            return { Roles: [], Permissions: [], ShowAdminRolesUI: false, permissions, role: user.Role };
        }
        const Permission = await extraArgument.api<UserPermission>(getUserPermissions());
        const isOwner = Permission.Roles.some(isOwnerRole);
        const permissions = getOrgPermissions(Permission.Permissions, isOwner);
        return { ...Permission, permissions, role: user.Role };
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

        const clearState = (state: SliceState, user: User) => {
            // If there's no current value or if the role didn't change, we don't need to trigger a refetch.
            if (!state.value || state.value.role === user.Role) {
                return;
            }
            // This will cause a refetch to happen the next time this thunk or hook is requested.
            // This is cleared when the user's role is changed to make sure that permissions are kept up-to-date.
            state.meta.fetchedEphemeral = undefined;
            state.value = undefined;
        };

        // NOTE: Since there's no event loop updates for self permissions, we currently rely on the user role to know when to refetch.
        builder.addCase(userFulfilled, (state, action) => {
            clearState(state, action.payload);
        });
        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }
            if (action.payload.User) {
                clearState(state, action.payload.User);
            }
        });
    },
});

export const userPermissionsReducer = { [name]: slice.reducer };
export const userPermissionsThunk = modelThunk.thunk;
export const userPermissionsFulfilled = modelThunk.fulfilled;
