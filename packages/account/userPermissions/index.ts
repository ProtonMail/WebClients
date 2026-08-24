import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { getUserPermissions } from '@proton/shared/lib/api/userPermissions';
import { type OrgPermissions, PERMISSIONS, type User, type UserPermission } from '@proton/shared/lib/interfaces';

import { serverEvent } from '../eventLoop';
import { isOwnerRole } from '../organizationRoles/helpers';
import { type UserState, userFulfilled, userThunk } from '../user';

const name = 'userPermissions';

interface ExtendedUserPermission extends UserPermission {
    permissions: OrgPermissions | null;
    role: number;
}

export interface UserPermissionsState extends UserState {
    [name]: ModelState<ExtendedUserPermission>;
}

type SliceState = UserPermissionsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectUserPermissions = (state: UserPermissionsState) => state[name];

export const getOrgPermissions = (
    permissions: UserPermission['Permissions'],
    grantAllPermissions: boolean
): OrgPermissions => {
    const permissionsSet = new Set(permissions);
    // @todo: remove the dependency of user state when legacy permission system is retired
    const entries = PERMISSIONS.map((p) => [p, grantAllPermissions || permissionsSet.has(p)] as const);
    return Object.fromEntries(entries) as OrgPermissions;
};

export const EMPTY_ORG_PERMISSIONS: OrgPermissions = getOrgPermissions([], false);

const modelThunk = createAsyncModelThunk<Model, UserPermissionsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument, dispatch }) => {
        const user = await dispatch(userThunk());
        // A runtime unleash toggle won't reflect until the next refetch, but that's fine in practice.
        const flag = extraArgument.unleashClient?.isEnabled('AdminRoleMVP') ?? false;
        const isLegacyAdmin = user.isAdmin && user.isSelf;
        const permissions = getOrgPermissions([], isLegacyAdmin);
        const defaultValue = { Roles: [], Permissions: [], ShowAdminRolesUI: false, permissions, role: user.Role };
        if (!flag) {
            return defaultValue;
        }
        try {
            const Permission = await extraArgument.api<UserPermission>(getUserPermissions());
            const isOwner = Permission.Roles.some(isOwnerRole);
            const permissions = getOrgPermissions(Permission.Permissions, isOwner);
            return { ...Permission, permissions, role: user.Role };
        } catch {
            // If the endpoint fails, fall back to the safe legacy-admin default rather than leaving
            // `permissions` at null forever, which would make every `permissions === null` loading
            // guard spin indefinitely.
            return defaultValue;
        }
    },
    previous: previousSelector(selectUserPermissions),
});

const defaultUserPermissions: Model = {
    permissions: null,
    role: 0,
    Roles: [],
    Permissions: [],
    ShowAdminRolesUI: false,
};

const initialState = getInitialModelState<Model>(defaultUserPermissions);

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
            // Invalidate the cache so the permissions are refetched: clearing fetchedEphemeral is what
            // makes the hook re-enqueue the thunk, and resetting fetchedAt makes cacheHelper treat the
            // cache as expired so thunk consumers await the fresh value instead of being served this one.
            // The previous value is deliberately left in place until that refetch lands. Consumers gate on
            // `permissions === null` as their loading signal, so blanking it here would drop the org
            // entries from the sidebar and swap the settings area for a spinner on every role change. The
            // trade-off is that a demoted user keeps seeing entries they no longer have access to until
            // the refetch resolves; the API rejects the underlying calls in the meantime.
            state.meta.fetchedEphemeral = undefined;
            state.meta.fetchedAt = 0;
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
