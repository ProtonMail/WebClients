import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { createSlice } from '@reduxjs/toolkit';
import { ElementsState, NewStateParams } from './elementsTypes';
import { resetState as resetStateAction, load, loadStarted, loadSuccess } from './elementsActions';

export const newState = ({
    page = 0,
    params = {
        labelID: MAILBOX_LABEL_IDS.INBOX,
        filter: {},
        sort: { sort: 'Time', desc: false },
        search: {},
        esEnabled: false,
    },
    retry = { payload: null, count: 0, error: undefined },
    beforeFirstLoad = true,
}: NewStateParams = {}): ElementsState => {
    return {
        beforeFirstLoad,
        invalidated: false,
        pendingRequest: false,
        params,
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
    reducers: {
        resetState: resetStateAction,
    },
    extraReducers: (builder) => {
        builder.addCase(load.pending, loadStarted);
        builder.addCase(load.fulfilled, loadSuccess);
    },
});

// Extract the action creators object and the reducer
const { actions, reducer } = elementsSlice;

// Extract and export each action creator by name
export const { resetState } = actions;

// Export the reducer, either as a default or named export
export default reducer;
