import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { globalReset } from '../actions';
import {
    labelConversations,
    labelMessages,
    markConversationsAsRead,
    markConversationsAsUnread,
    markMessagesAsRead,
    markMessagesAsUnread,
    unlabelConversations,
    unlabelMessages,
} from '../mailbox/mailboxActions';
import { deleteDraft } from '../messages/draft/messagesDraftActions';
import { expireMessages } from '../messages/expire/messagesExpireActions';
import { filterSubscriptionList } from '../newsletterSubscriptions/newsletterSubscriptionsActions';
import {
    addESResults,
    backendActionFinished,
    backendActionStarted,
    esSearchSettled,
    esSearchStarted,
    eventUpdates,
    invalidate,
    load,
    loadConversation,
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
    removeExpired,
    reset,
    resetRetry,
    retry,
    setParams,
    showSerializedElements as showSerializedElementsAction,
    updatePage,
} from './elementsActions';
import { newElementsState } from './elementsInitialState';
import {
    addESResults as addESResultsReducer,
    backendActionFinished as backendActionFinishedReducer,
    backendActionStarted as backendActionStartedReducer,
    deleteDraft as deleteDraftReducer,
    esSearchSettled as esSearchSettledReducer,
    esSearchStarted as esSearchStartedReducer,
    eventUpdatesFulfilled,
    eventUpdatesPending,
    expireElementsFulfilled,
    expireElementsPending,
    expireElementsRejected,
    globalReset as globalResetReducer,
    invalidate as invalidateReducer,
    labelConversationsPending,
    labelMessagesPending,
    labelMessagesRejected,
    loadConversationFulfilled,
    loadFulfilled,
    loadPending,
    manualFulfilled as manualFulfilledReducer,
    manualPending as manualPendingReducer,
    markConversationsAsReadPending,
    markConversationsAsReadRejected,
    markConversationsAsUnreadPending,
    markConversationsAsUnreadRejected,
    markMessagesAsReadPending,
    markMessagesAsReadRejected,
    markMessagesAsUnreadPending,
    markMessagesAsUnreadRejected,
    markNewsletterElementsAsReadPending,
    optimisticDelete as optimisticDeleteReducer,
    optimisticEmptyLabel as optimisticEmptyLabelReducer,
    optimisticUpdates,
    pollTaskRunningFulfilled,
    removeExpired as removeExpiredReducer,
    reset as resetReducer,
    resetRetry as resetRetryReducer,
    retry as retryReducer,
    selectAllFulfilled,
    setParams as setParamsReducer,
    showSerializedElements as showSerializedElementsReducer,
    unlabelConversationsPending,
    unlabelMessagesPending,
    updatePage as updatePageReducer,
} from './elementsReducers';
import { pollTaskRunning } from './elementsTaskRunning';
import type { ElementsStateParams, TaskRunningInfo } from './elementsTypes';

export { newElementsState } from './elementsInitialState';
export { pollTaskRunning } from './elementsTaskRunning';

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
        builder.addCase(resetRetry, resetRetryReducer);
        builder.addCase(removeExpired, removeExpiredReducer);
        builder.addCase(invalidate, invalidateReducer);
        builder.addCase(eventUpdates.pending, eventUpdatesPending);
        builder.addCase(eventUpdates.fulfilled, eventUpdatesFulfilled);

        builder.addCase(manualPending, manualPendingReducer);
        builder.addCase(manualFulfilled, manualFulfilledReducer);
        builder.addCase(addESResults, addESResultsReducer);
        builder.addCase(esSearchStarted, esSearchStartedReducer);
        builder.addCase(esSearchSettled, esSearchSettledReducer);

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

        builder.addCase(markMessagesAsRead.pending, markMessagesAsReadPending);
        builder.addCase(markMessagesAsRead.rejected, markMessagesAsReadRejected);
        builder.addCase(markMessagesAsUnread.pending, markMessagesAsUnreadPending);
        builder.addCase(markMessagesAsUnread.rejected, markMessagesAsUnreadRejected);
        builder.addCase(markConversationsAsRead.pending, markConversationsAsReadPending);
        builder.addCase(markConversationsAsRead.rejected, markConversationsAsReadRejected);
        builder.addCase(markConversationsAsUnread.pending, markConversationsAsUnreadPending);
        builder.addCase(markConversationsAsUnread.rejected, markConversationsAsUnreadRejected);

        builder.addCase(filterSubscriptionList.pending, markNewsletterElementsAsReadPending);

        builder.addCase(labelMessages.pending, labelMessagesPending);
        builder.addCase(labelMessages.rejected, labelMessagesRejected);
        builder.addCase(unlabelMessages.pending, unlabelMessagesPending);
        builder.addCase(unlabelMessages.rejected, labelMessagesRejected);

        builder.addCase(labelConversations.pending, labelConversationsPending);
        builder.addCase(unlabelConversations.pending, unlabelConversationsPending);

        builder.addCase(loadConversation.fulfilled, loadConversationFulfilled);
    },
});

export const elementsSliceActions = elementsSlice.actions;
export const elementsReducer = { [name]: elementsSlice.reducer };
