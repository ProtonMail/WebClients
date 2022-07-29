import { createSlice } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { globalReset } from '../actions';
import {
    addESResults,
    backendActionFinished,
    backendActionStarted,
    eventUpdates,
    invalidate,
    load,
    manualFulfilled,
    manualPending,
    moveAll,
    optimisticApplyLabels,
    optimisticDelete,
    optimisticEmptyLabel,
    optimisticMarkAs,
    optimisticRestoreDelete,
    optimisticRestoreEmptyLabel,
    pollTaskRunning,
    removeExpired,
    reset,
    retry,
    retryStale,
    updatePage,
} from './elementsActions';
import {
    addESResults as addESResultsReducer,
    backendActionFinished as backendActionFinishedReducer,
    backendActionStarted as backendActionStartedReducer,
    eventUpdatesFulfilled,
    eventUpdatesPending,
    globalReset as globalResetReducer,
    invalidate as invalidateReducer,
    loadFulfilled,
    loadPending,
    manualFulfilled as manualFulfilledReducer,
    manualPending as manualPendingReducer,
    moveAllFulfilled,
    optimisticDelete as optimisticDeleteReducer,
    optimisticEmptyLabel as optimisticEmptyLabelReducer,
    optimisticUpdates,
    pollTaskRunningFulfilled,
    removeExpired as removeExpiredReducer,
    reset as resetReducer,
    retry as retryReducer,
    retryStale as retryStaleReducer,
    updatePage as updatePageReducer,
} from './elementsReducers';
import { ElementsState, ElementsStateParams, NewStateParams, TaskRunningInfo } from './elementsTypes';

export const newState = ({
    page = 0,
    params = {},
    retry = { payload: null, count: 0, error: undefined },
    beforeFirstLoad = true,
    taskRunning = { labelIDs: [], timeoutID: undefined },
}: NewStateParams & { taskRunning?: TaskRunningInfo } = {}): ElementsState => {
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
        pendingActions: 0,
        params: { ...defaultParams, ...params },
        page,
        total: undefined,
        elements: {},
        pages: [],
        bypassFilter: [],
        retry,
        taskRunning,
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
        builder.addCase(retry, retryReducer);
        builder.addCase(retryStale, retryStaleReducer);
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
        builder.addCase(backendActionStarted, backendActionStartedReducer);
        builder.addCase(backendActionFinished, backendActionFinishedReducer);

        builder.addCase(moveAll.fulfilled, moveAllFulfilled);
        builder.addCase(pollTaskRunning.fulfilled, pollTaskRunningFulfilled);
    },
});

// Export the reducer, either as a default or named export
export default elementsSlice.reducer;
