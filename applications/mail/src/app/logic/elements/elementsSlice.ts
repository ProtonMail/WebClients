import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { createSlice } from '@reduxjs/toolkit';
import { ElementsState, ElementsStateParams, NewStateParams } from './elementsTypes';
import {
    reset,
    updatePage,
    load,
    removeExpired,
    invalidate,
    eventUpdates,
    manualPending,
    manualFulfilled,
    addESResults,
    optimisticApplyLabels,
    optimisticDelete,
    optimisticRestoreDelete,
    optimisticEmptyLabel,
    optimisticRestoreEmptyLabel,
    optimisticMarkAs,
} from './elementsActions';
import {
    globalReset as globalResetReducer,
    reset as resetReducer,
    updatePage as updatePageReducer,
    loadPending,
    loadFulfilled,
    removeExpired as removeExpiredReducer,
    invalidate as invalidateReducer,
    eventUpdatesPending,
    eventUpdatesFulfilled,
    manualPending as manualPendingReducer,
    manualFulfilled as manualFulfilledReducer,
    addESResults as addESResultsReducer,
    optimisticUpdates,
    optimisticDelete as optimisticDeleteReducer,
    optimisticEmptyLabel as optimisticEmptyLabelReducer,
} from './elementsReducers';
import { globalReset } from '../actions';

export const newState = ({
    page = 0,
    params = {},
    retry = { payload: null, count: 0, error: undefined },
    beforeFirstLoad = true,
}: NewStateParams = {}): ElementsState => {
    const defaultParams: ElementsStateParams = {
        labelID: MAILBOX_LABEL_IDS.INBOX,
        conversationMode: true,
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
        builder.addCase(globalReset, globalResetReducer);
        builder.addCase(reset, resetReducer);
        builder.addCase(updatePage, updatePageReducer);
        builder.addCase(load.pending, loadPending);
        builder.addCase(load.fulfilled, loadFulfilled);
        builder.addCase(removeExpired, removeExpiredReducer);
        builder.addCase(invalidate, invalidateReducer);
        builder.addCase(eventUpdates.pending, eventUpdatesPending);
        builder.addCase(eventUpdates.fulfilled, eventUpdatesFulfilled);

        builder.addCase(manualPending, manualPendingReducer);
        builder.addCase(manualFulfilled, manualFulfilledReducer);
        builder.addCase(addESResults, addESResultsReducer);

        builder.addCase(optimisticApplyLabels, optimisticUpdates);
        builder.addCase(optimisticDelete, optimisticDeleteReducer);
        builder.addCase(optimisticRestoreDelete, optimisticUpdates);
        builder.addCase(optimisticEmptyLabel, optimisticEmptyLabelReducer);
        builder.addCase(optimisticRestoreEmptyLabel, optimisticUpdates);
        builder.addCase(optimisticMarkAs, optimisticUpdates);
    },
});

// Export the reducer, either as a default or named export
export default elementsSlice.reducer;
