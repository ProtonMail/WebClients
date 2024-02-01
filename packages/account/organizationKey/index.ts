import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getOrganizationKeys } from '@proton/shared/lib/api/organization';
import type { CachedOrganizationKey, OrganizationKey } from '@proton/shared/lib/interfaces';
import { getCachedOrganizationKey } from '@proton/shared/lib/keys';

import type { ModelState } from '../interface';
import { OrganizationState, organizationThunk } from '../organization';
import { UserState, userThunk } from '../user';

const name = 'organizationKey' as const;

export interface OrganizationKeyState extends UserState, OrganizationState {
    [name]: ModelState<CachedOrganizationKey>;
}

type SliceState = OrganizationKeyState[typeof name];
type Model = SliceState['value'];

export const selectOrganizationKey = (state: OrganizationKeyState) => state.organizationKey;

const modelThunk = createAsyncModelThunk<Model, OrganizationKeyState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const [user, organization] = await Promise.all([dispatch(userThunk()), dispatch(organizationThunk())]);
        if (!user.isAdmin || !organization.HasKeys) {
            return { Key: {}, placeholder: true };
        }
        const Key = await extraArgument.api<OrganizationKey>(getOrganizationKeys());
        return getCachedOrganizationKey({ keyPassword: extraArgument.authentication.getPassword(), Key });
    },
    previous: previousSelector(selectOrganizationKey),
});

const initialState: SliceState = {
    value: undefined,
    error: undefined,
};
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const organizationKeyReducer = { [name]: slice.reducer };
export const organizationKeyThunk = modelThunk.thunk;
