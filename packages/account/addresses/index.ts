import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Address } from '@proton/shared/lib/interfaces';
import { sortAddresses } from '@proton/shared/lib/mail/addresses';
import { removeById } from '@proton/utils/removeById';
import { upsertById } from '@proton/utils/upsertById';

import { serverEvent } from '../eventLoop';
import { initEvent } from '../init';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';

const name = 'addresses' as const;

export interface AddressesState {
    [name]: ModelState<Address[]>;
}

type SliceState = AddressesState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectAddresses = (state: AddressesState) => state[name];

const modelThunk = createAsyncModelThunk<Model, AddressesState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return getAllAddresses(extraArgument.api).then(sortAddresses);
    },
    previous: previousSelector(selectAddresses),
});

const initialState = getInitialModelState<Model>();

const slice = createSlice({
    name,
    initialState,
    reducers: {
        deleteAddress: (state, action: PayloadAction<{ ID: string }>) => {
            if (!state.value) {
                return;
            }
            state.value = sortAddresses(removeById(state.value, action.payload, 'ID'));
        },
        upsertAddress: (state, action: PayloadAction<Address>) => {
            if (!state.value) {
                return;
            }
            state.value = sortAddresses(upsertById(state.value, action.payload, 'ID'));
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder
            .addCase(initEvent, (state, action) => {
                if (action.payload.Addresses) {
                    state.value = action.payload.Addresses;
                }
            })
            .addCase(serverEvent, (state, action) => {
                if (state.value && action.payload.Addresses) {
                    state.value = sortAddresses(
                        updateCollection({
                            model: state.value,
                            events: action.payload.Addresses,
                            itemKey: 'Address',
                        })
                    );
                }
            });
    },
});

export const addressesReducer = { [name]: slice.reducer };
export const addressesThunk = modelThunk.thunk;
export const addressActions = slice.actions;
