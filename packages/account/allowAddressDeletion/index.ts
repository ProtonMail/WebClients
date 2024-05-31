import { createAction, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getAllowAddressDeletion } from '@proton/shared/lib/api/addresses';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';

const name = 'allowAddressDeletion' as const;

export interface AllowAddressDeletionState {
    [name]: ModelState<boolean>;
}

const initialState = getInitialModelState<boolean>();

export const selectAllowAddressDeletion = (state: AllowAddressDeletionState) => state[name];

const modelThunk = createAsyncModelThunk<boolean, AllowAddressDeletionState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return extraArgument
            .api(getAllowAddressDeletion())
            .then((response) => response.AddressDeletion.Allow)
            .catch(() => false);
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

export const allowAddressDeletionReducer = { [name]: slice.reducer };
export const allowAddressDeletionThunk = modelThunk.thunk;
