import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

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
    resetRetry,
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
    labelConversationsPending,
    labelMessagesPending,
    labelMessagesRejected,
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
        builder.addCase(resetRetry, resetRetryReducer);
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
    },
});

export const elementsSliceActions = elementsSlice.actions;
export const elementsReducer = { [name]: elementsSlice.reducer };
