import { createSlice } from '@reduxjs/toolkit';

import * as actions from './incomingDefaultsActions';
import * as reducer from './incomingDefaultsReducer';
import type { IncomingDefaultsState } from './incomingDefaultsTypes';

export const incomingDefaultsInitialState: IncomingDefaultsState = {
    list: [],
    status: 'not-loaded',
} as IncomingDefaultsState;

const name = 'incomingDefaults';
const incomingDefaultsSlice = createSlice({
    name,
    initialState: incomingDefaultsInitialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(actions.loadIncomingDefaults.pending, reducer.loadPending);
        builder.addCase(actions.loadIncomingDefaults.fulfilled, reducer.loadFulfilled);
        builder.addCase(actions.loadIncomingDefaults.rejected, reducer.loadRejected);

        builder.addCase(actions.event, reducer.event);

        builder.addCase(actions.addBlockAddresses.fulfilled, reducer.blockAddressesFullfilled);

        builder.addCase(actions.remove.fulfilled, reducer.removeFullfilled);
    },
});

export const incomingDefaultsReducer = { [name]: incomingDefaultsSlice.reducer };
