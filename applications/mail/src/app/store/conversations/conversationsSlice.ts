import { createSlice } from '@reduxjs/toolkit';

import { globalReset } from '../actions';
import { eventUpdates, load as loadElements } from '../elements/elementsActions';
import {
    labelConversations,
    labelMessages,
    markConversationsAsRead,
    markConversationsAsUnread,
    markMessagesAsRead,
    markMessagesAsUnread,
    unlabelConversations,
} from '../mailbox/mailboxActions';
import * as messageDraftAction from '../messages/draft/messagesDraftActions';
import {
    applyLabelsOnConversation,
    applyLabelsOnConversationMessages,
    deleteConversation,
    eventConversationUpdate,
    eventDelete,
    eventMessageUpdate,
    initialize,
    load,
    optimisticDelete,
    optimisticDeleteConversationMessages,
    optimisticMarkAsConversation,
    optimisticMarkAsConversationMessages,
    optimisticRestore,
    retryLoading,
    updateConversation,
} from './conversationsActions';
import {
    applyLabelsOnConversationMessages as applyLabelsOnConversationMessagesReducer,
    applyLabelsOnConversation as applyLabelsOnConversationReducer,
    deleteConversation as deleteConversationReducer,
    eventConversationUpdate as eventConversationUpdateReducer,
    eventMessagesUpdates as eventMessageUpdateReducer,
    globalReset as globalResetReducer,
    initialize as initializeReducer,
    labelConversationsPending,
    labelMessagesPending,
    loadFulfilled,
    loadRejected,
    markConversationsAsReadPending,
    markConversationsAsUnreadPending,
    markMessagesAsReadPending,
    markMessagesAsUnreadPending,
    optimisticDeleteConversationMessages as optimisticDeleteConversationMessagesReducer,
    optimisticDelete as optimisticDeleteReducer,
    optimisticMarkAsConversationMessages as optimisticMarkAsConversationMessagesReducer,
    optimisticMarkAsConversation as optimisticMarkAsConversationReducer,
    optimisticRestore as optimisticRestoreReducer,
    retryLoading as retryLoadingReducer,
    unlabelConversationsPending,
    updateConversation as updateConversationReducer,
    updateFromElements,
    updateFromLoadElements,
    updateMessageOnSend,
} from './conversationsReducers';
import type { ConversationsState } from './conversationsTypes';

const name = 'conversations';
const conversationSlice = createSlice({
    name,
    initialState: {} as ConversationsState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, globalResetReducer);
        builder.addCase(initialize, initializeReducer);
        builder.addCase(load.fulfilled, loadFulfilled);
        builder.addCase(load.rejected, loadRejected);
        builder.addCase(retryLoading, retryLoadingReducer);
        builder.addCase(applyLabelsOnConversationMessages, applyLabelsOnConversationMessagesReducer);
        builder.addCase(applyLabelsOnConversation, applyLabelsOnConversationReducer);
        builder.addCase(deleteConversation, deleteConversationReducer);
        builder.addCase(optimisticDelete, optimisticDeleteReducer);
        builder.addCase(optimisticRestore, optimisticRestoreReducer);
        builder.addCase(optimisticDeleteConversationMessages, optimisticDeleteConversationMessagesReducer);
        builder.addCase(optimisticMarkAsConversationMessages, optimisticMarkAsConversationMessagesReducer);
        builder.addCase(optimisticMarkAsConversation, optimisticMarkAsConversationReducer);
        builder.addCase(updateConversation, updateConversationReducer);
        builder.addCase(eventMessageUpdate, eventMessageUpdateReducer);
        builder.addCase(eventDelete, deleteConversationReducer);
        builder.addCase(eventConversationUpdate, eventConversationUpdateReducer);
        builder.addCase(loadElements.fulfilled, updateFromElements);
        builder.addCase(eventUpdates.fulfilled, updateFromLoadElements);
        builder.addCase(messageDraftAction.sent, updateMessageOnSend);
        builder.addCase(markMessagesAsRead.pending, markMessagesAsReadPending);
        builder.addCase(markMessagesAsUnread.pending, markMessagesAsUnreadPending);
        builder.addCase(markConversationsAsRead.pending, markConversationsAsReadPending);
        builder.addCase(markConversationsAsUnread.pending, markConversationsAsUnreadPending);
        builder.addCase(labelConversations.pending, labelConversationsPending);
        builder.addCase(unlabelConversations.pending, unlabelConversationsPending);
        builder.addCase(labelMessages.pending, labelMessagesPending);
    },
});

export const conversationsReducer = { [name]: conversationSlice.reducer };
