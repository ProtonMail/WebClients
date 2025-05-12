import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { globalReset } from '../actions';
import { deleteDraft } from '../messages/draft/messagesDraftActions';
import { expireMessages } from '../messages/expire/messagesExpireActions';
import {
    addESResults,
    backendActionFinished,
    backendActionStarted,
    eventUpdates,
    invalidate,
    load,
    manualFulfilled,
    manualPending,
    markAll,
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
    setParams,
    showSerializedElements as showSerializedElementsAction,
    updatePage,
} from './elementsActions';
import {
    addESResults as addESResultsReducer,
    backendActionFinished as backendActionFinishedReducer,
    backendActionStarted as backendActionStartedReducer,
    deleteDraft as deleteDraftReducer,
    eventUpdatesFulfilled,
    eventUpdatesPending,
    expireElementsFulfilled,
    expireElementsPending,
    expireElementsRejected,
    globalReset as globalResetReducer,
    invalidate as invalidateReducer,
    loadFulfilled,
    loadPending,
    manualFulfilled as manualFulfilledReducer,
    manualPending as manualPendingReducer,
    optimisticDelete as optimisticDeleteReducer,
    optimisticEmptyLabel as optimisticEmptyLabelReducer,
    optimisticUpdates,
    pollTaskRunningFulfilled,
    removeExpired as removeExpiredReducer,
    reset as resetReducer,
    retry as retryReducer,
    selectAllFulfilled,
    setParams as setParamsReducer,
    showSerializedElements as showSerializedElementsReducer,
    updatePage as updatePageReducer,
} from './elementsReducers';
import type { ElementsState, ElementsStateParams, NewStateParams, TaskRunningInfo } from './elementsTypes';

export const newElementsState = ({
    page = 0,
    params = {},
    retry = { payload: null, count: 0, error: undefined },
    beforeFirstLoad = true,
    taskRunning = { labelIDs: [], timeoutID: undefined },
}: NewStateParams & { taskRunning?: TaskRunningInfo } = {}): ElementsState => {
    // TODO, we could add a default value for elementID and messageID in the future
    // Once the old MailboxContainer is removed. Adding default value breaks some e2e and unit tests right now
    const defaultParams: ElementsStateParams = {
        labelID: MAILBOX_LABEL_IDS.INBOX,
        conversationMode: true,
        filter: {},
        sort: { sort: 'Time', desc: true },
        search: {},
        esEnabled: false,
        isSearching: false,
    };

    return {
        beforeFirstLoad,
        invalidated: false,
        pendingRequest: false,
        pendingActions: 0,
        params: { ...defaultParams, ...params },
        page,
        total: {},
        elements: {},
        pages: {},
        bypassFilter: [],
        retry,
        taskRunning,
    };
};

const name = 'elements';
const elementsSlice = createSlice({
    name,
    initialState: newElementsState(),
    reducers: {
        updateTasksRunning: (state, action: PayloadAction<{ taskRunning: TaskRunningInfo }>) => {
            state.taskRunning = action.payload.taskRunning;
        },
        updateStateParams: (state, action: PayloadAction<Partial<ElementsStateParams>>) => {
            state.params = { ...(state.params || {}), ...action.payload };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(globalReset, globalResetReducer);

        builder.addCase(reset, resetReducer);
        builder.addCase(updatePage, updatePageReducer);
        builder.addCase(load.pending, loadPending);
        builder.addCase(load.fulfilled, loadFulfilled);
        builder.addCase(retry, retryReducer);
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

        builder.addCase(moveAll.fulfilled, selectAllFulfilled);
        builder.addCase(markAll.fulfilled, selectAllFulfilled);
        builder.addCase(pollTaskRunning.fulfilled, pollTaskRunningFulfilled);

        builder.addCase(deleteDraft, deleteDraftReducer);

        builder.addCase(expireMessages.pending, expireElementsPending);
        builder.addCase(expireMessages.fulfilled, expireElementsFulfilled);
        builder.addCase(expireMessages.rejected, expireElementsRejected);

        builder.addCase(showSerializedElementsAction, showSerializedElementsReducer);

        builder.addCase(setParams, setParamsReducer);
    },
});

export const elementsSliceActions = elementsSlice.actions;
export const elementsReducer = { [name]: elementsSlice.reducer };
