import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getOrganizationKeys } from '@proton/shared/lib/api/organization';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { CachedOrganizationKey, Organization, OrganizationKey, UserModel } from '@proton/shared/lib/interfaces';
import { getCachedOrganizationKey } from '@proton/shared/lib/keys';

import type { AddressKeysState } from '../addressKeys';
import type { AddressesState } from '../addresses';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import type { MembersState } from '../members';
import { type OrganizationState, organizationThunk } from '../organization';
import { type UserState, userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';

const name = 'organizationKey' as const;

export interface OrganizationKeyState
    extends UserState,
        OrganizationState,
        UserKeysState,
        AddressesState,
        AddressKeysState,
        MembersState {
    [name]: ModelState<CachedOrganizationKey>;
}

type SliceState = OrganizationKeyState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectOrganizationKey = (state: OrganizationKeyState) => state.organizationKey;

const canFetch = (user: UserModel, organization: Organization) => {
    return user.isAdmin && organization.HasKeys;
};

const modelThunk = createAsyncModelThunk<Model, OrganizationKeyState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ getState, dispatch, extraArgument }) => {
        const [user, organization] = await Promise.all([dispatch(userThunk()), dispatch(organizationThunk())]);
        if (!canFetch(user, organization)) {
            return { Key: {}, placeholder: true };
        }
        const Key = await extraArgument.api<OrganizationKey>(getOrganizationKeys());
        const userKeys = await dispatch(userKeysThunk());
        const state = selectOrganizationKey(getState());
        if (state.value && state.value.privateKey && isDeepEqual(state.value.Key, Key)) {
            // The organization key is spammed pretty often, so if the key is exactly the same, just return the old value.
            // This is to avoid the crypto proxy destroying the old key in memory while it may still be used in some async processes.
            return state.value;
        }
        return getCachedOrganizationKey({ userKeys, keyPassword: extraArgument.authentication.getPassword(), Key });
    },
    previous: previousSelector(selectOrganizationKey),
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

export const organizationKeyReducer = { [name]: slice.reducer };
export const organizationKeyThunk = modelThunk.thunk;
