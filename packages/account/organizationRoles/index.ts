import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getOrganizationRoles } from '@proton/shared/lib/api/organizationRoles';
import type { OrganizationRole } from '@proton/shared/lib/interfaces';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import type { UserState } from '../user';

const name = 'organizationRoles' as const;

export interface OrganizationRolesState extends UserState {
    [name]: ModelState<OrganizationRole[]>;
}

type SliceState = OrganizationRolesState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectOrganizationRoles = (state: OrganizationRolesState) => state[name];

const modelThunk = createAsyncModelThunk<Model, OrganizationRolesState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        const isEnabled = extraArgument.unleashClient?.isEnabled('AdminRoleMVP') ?? false;
        if (!isEnabled) {
            return [];
        }
        const { Roles } = await extraArgument.api<{ Roles: OrganizationRole[] }>(getOrganizationRoles());
        return Roles;
    },
    previous: previousSelector(selectOrganizationRoles),
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

export const organizationRolesReducer = { [name]: slice.reducer };
export const organizationRolesThunk = modelThunk.thunk;
