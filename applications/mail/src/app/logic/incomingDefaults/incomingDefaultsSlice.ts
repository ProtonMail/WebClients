import { createSlice } from '@reduxjs/toolkit';

import * as actions from './incomingDefaultsActions';
import * as reducer from './incomingDefaultsReducer';
import { IncomingDefaultsState } from './incomingDefaultsTypes';

const incomingDefaultsSlice = createSlice({
    name: 'incomingDefaults',
    initialState: {
        list: [],
        status: 'not-loaded',
    } as IncomingDefaultsState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(actions.load.pending, reducer.loadPending);
        builder.addCase(actions.load.fulfilled, reducer.loadFulfilled);
        builder.addCase(actions.load.rejected, reducer.loadRejected);

        builder.addCase(actions.event, reducer.event);

        builder.addCase(actions.addBlockAddresses.fulfilled, reducer.blockAddressesFullfilled);

        builder.addCase(actions.remove.fulfilled, reducer.removeFullfilled);
    },
});

export default incomingDefaultsSlice.reducer;
