import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { createSlice } from '@reduxjs/toolkit';
import { ElementsState, ElementsStateParams, NewStateParams } from './elementsTypes';
import { reset, load, removeExpired, eventUpdates } from './elementsActions';
import {
    reset as resetReducer,
    loadPending,
    loadFulfilled,
    removeExpired as removeExpiredReducer,
    eventUpdatesPending,
    eventUpdatesFulfilled,
} from './elementsReducers';

export const newState = ({
    page = 0,
    params = {},
    retry = { payload: null, count: 0, error: undefined },
    beforeFirstLoad = true,
}: NewStateParams = {}): ElementsState => {
    const defaultParams: ElementsStateParams = {
        labelID: MAILBOX_LABEL_IDS.INBOX,
        filter: {},
        sort: { sort: 'Time', desc: true },
        search: {},
        esEnabled: false,
    };
    return {
        beforeFirstLoad,
        invalidated: false,
        pendingRequest: false,
        params: { ...defaultParams, ...params },
        page,
        total: undefined,
        elements: {},
        pages: [],
        bypassFilter: [],
        retry,
    };
};

const elementsSlice = createSlice({
    name: 'elements',
    initialState: newState(),
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(reset, resetReducer);
        builder.addCase(load.pending, loadPending);
        builder.addCase(load.fulfilled, loadFulfilled);
        builder.addCase(removeExpired, removeExpiredReducer);
        builder.addCase(eventUpdates.pending, eventUpdatesPending);
        builder.addCase(eventUpdates.fulfilled, eventUpdatesFulfilled);
    },
});

// Export the reducer, either as a default or named export
export default elementsSlice.reducer;
