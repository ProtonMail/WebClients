import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getUserPermissions } from '@proton/shared/lib/api/userPermissions';
import type { UserPermission } from '@proton/shared/lib/interfaces';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import type { UserState } from '../user';

const name = 'userPermissions';

export interface UserPermissionsState extends UserState {
    [name]: ModelState<UserPermission>;
}

type SliceState = UserPermissionsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectUserPermissions = (state: UserPermissionsState) => state[name];

const modelThunk = createAsyncModelThunk<Model, UserPermissionsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        const flag = extraArgument.unleashClient?.isEnabled('AdminRoleMVP') ?? false;
        if (!flag) {
            return { Roles: [], Permissions: [] };
        }
        const { Permission } = await extraArgument.api<{ Permission: UserPermission }>(getUserPermissions());
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
