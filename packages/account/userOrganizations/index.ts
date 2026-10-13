import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { getAllUserOrganizations } from '@proton/shared/lib/api/members';
import type { UserOrganization } from '@proton/shared/lib/interfaces/Organization';

import { type UserPermissionsState, isOrganizationOwnerThunk } from '../userPermissions';

const name = 'userOrganizations' as const;

export interface UserOrganizationsState extends UserPermissionsState {
    [name]: ModelState<UserOrganization[]>;
}

type SliceState = UserOrganizationsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectUserOrganizations = (state: UserOrganizationsState) => state[name];

const modelThunk = createAsyncModelThunk<Model, UserOrganizationsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument, dispatch }) => {
        // MSP owners are shown their subsidiaries instead (see mspSubsidiaries), skip the fetch.
        const isOwner = await dispatch(isOrganizationOwnerThunk());
        if (isOwner) {
            return [];
        }
        return getAllUserOrganizations(extraArgument.api);
    },
    previous: previousSelector(selectUserOrganizations),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        patch: (state, action: PayloadAction<{ id: string; changes: Partial<UserOrganization> }>) => {
            if (!state.value) {
                return;
            }
            const item = state.value.find((org) => org.OrganizationID === action.payload.id);
            if (item) {
                Object.assign(item, action.payload.changes);
            }
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const userOrganizationsReducer = { [name]: slice.reducer };
export const userOrganizationsThunk = modelThunk.thunk;
export const userOrganizationsActions = slice.actions;
