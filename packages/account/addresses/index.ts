import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Address } from '@proton/shared/lib/interfaces';
import { sortAddresses } from '@proton/shared/lib/mail/addresses';

import { serverEvent } from '../eventLoop';
import { initEvent } from '../init';
import type { ModelState } from '../interface';

const name = 'addresses';

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
