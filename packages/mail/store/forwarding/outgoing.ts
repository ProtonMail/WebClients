import { createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryAllOutgoingForwardings } from '@proton/shared/lib/api/forwardings';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';

interface State {
    outgoingAddressForwarding: ModelState<OutgoingAddressForwarding[]>;
}

const name = 'outgoingAddressForwarding';
type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectOutgoingForwarding = (state: State) => state[name];

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return queryAllOutgoingForwardings(extraArgument.api);
    },
    previous: previousSelector(selectOutgoingForwarding),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.OutgoingAddressForwardings) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.OutgoingAddressForwardings,
                    itemKey: 'OutgoingAddressForwarding',
                });
            }
        });
    },
});

export const outgoingAddressForwardingsReducer = { [name]: slice.reducer };
export const outgoingAddressForwardingsThunk = modelThunk.thunk;
