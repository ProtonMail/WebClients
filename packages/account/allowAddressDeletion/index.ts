import { createAction, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getAllowAddressDeletion } from '@proton/shared/lib/api/addresses';
import { Api } from '@proton/shared/lib/interfaces';

import type { ModelState } from '../interface';

const name = 'allowAddressDeletion';

export interface AllowAddressDeletionState {
    [name]: ModelState<boolean>;
}

type SliceState = AllowAddressDeletionState[typeof name];

const initialState: SliceState = {
    value: undefined,
    error: undefined,
};

export const selectAllowAddressDeletion = (state: AllowAddressDeletionState) => state[name];

const modelThunk = createAsyncModelThunk<boolean, AllowAddressDeletionState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return extraArgument.api(getAllowAddressDeletion()).then((response) => response.AddressDeletion.Allow);
    },
    previous: previousSelector(selectAllowAddressDeletion),
});

export const disableAllowAddressDeletion = createAction('allowAddressDeletion/update', () => ({ payload: {} }));

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);

        builder.addCase(disableAllowAddressDeletion, (state) => {
            state.value = false;
        });
    },
});

export interface Params {
    api: Api;
}

export const allowAddressDeletionReducer = { [name]: slice.reducer };
export const allowAddressDeletionThunk = modelThunk.thunk;
