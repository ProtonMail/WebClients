import { createAction, createSlice } from '@reduxjs/toolkit';

import type { DecryptedAddressKey } from '@proton/shared/lib/interfaces';

import type { AddressesState } from '../addresses';
import type { ModelState } from '../interface';
import type { UserState } from '../user';
import type { UserKeysState } from '../userKeys';
import { addressKeysModelThunk } from './thunk';

const name = 'addressKeys';

export interface AddressKeysState extends UserState, AddressesState, UserKeysState {
    [name]: { [id: string]: ModelState<DecryptedAddressKey[]> };
}

type SliceState = AddressKeysState[typeof name];
type Model = SliceState;

export const selectAddressKeys = (state: AddressKeysState) => state.addressKeys;

const initialState: Model = {};

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(addressKeysModelThunk.pending, (state, action) => {
                const oldValue = state[action.meta.id];
                if (oldValue && oldValue.error) {
                    oldValue.error = undefined;
                }
            })
            .addCase(addressKeysModelThunk.fulfilled, (state, action) => {
                state[action.meta.id] = { value: action.payload, error: undefined };
            })
            .addCase(addressKeysModelThunk.rejected, (state, action) => {
                state[action.meta.id] = { value: undefined, error: action.payload };
            });
    },
});

export const addressKeysReducer = { [name]: slice.reducer };
export const addressKeysThunk = addressKeysModelThunk.thunk;

export const getAllAddressKeysAction = createAction(`${name}/all`);
