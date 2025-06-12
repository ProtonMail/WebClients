import { createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryAllIncomingForwardings } from '@proton/shared/lib/api/forwardings';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { IncomingAddressForwarding } from '@proton/shared/lib/interfaces';

interface State {
    incomingAddressForwarding: ModelState<IncomingAddressForwarding[]>;
}

const name = 'incomingAddressForwarding';
type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectIncomingForwarding = (state: State) => state[name];

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return queryAllIncomingForwardings(extraArgument.api);
    },
    previous: previousSelector(selectIncomingForwarding),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.IncomingAddressForwardings) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.IncomingAddressForwardings,
                    itemKey: 'IncomingAddressForwarding',
                });
            }
        });
    },
});

export const incomingAddressForwardingsReducer = { [name]: slice.reducer };
export const incomingAddressForwardingsThunk = modelThunk.thunk;
