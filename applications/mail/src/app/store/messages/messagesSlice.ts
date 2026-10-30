import { createSlice } from '@reduxjs/toolkit';

import { addMessagesCases } from '@proton/mail-message/store/messages/messagesCases';
import type { MessagesState } from '@proton/mail-message/store/messages/messagesTypes';
import { reset } from '@proton/mail-message/store/messages/read/messagesReadReducers';

import { globalReset } from '../actions';
import { load as loadElements } from '../elements/elementsActions';
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
import {
    labelConversationsPending,
    labelMessagesPending,
    markConversationsAsReadPending,
    markConversationsAsUnreadPending,
    markMessagesAsReadPending,
    markMessagesAsUnreadPending,
    unlabelConversationsPending,
    unlabelMessagesPending,
    updateFromElements,
} from './messagesMailboxReducers';

const name = 'messages';
const messagesSlice = createSlice({
    name,
    initialState: {} as MessagesState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, reset);

        addMessagesCases(builder);

        builder.addCase(loadElements.fulfilled, updateFromElements);

        builder.addCase(markMessagesAsRead.pending, markMessagesAsReadPending);
        builder.addCase(markMessagesAsUnread.pending, markMessagesAsUnreadPending);
        builder.addCase(markConversationsAsRead.pending, markConversationsAsReadPending);
        builder.addCase(markConversationsAsUnread.pending, markConversationsAsUnreadPending);

        builder.addCase(labelMessages.pending, labelMessagesPending);
        // builder.addCase(labelMessages.rejected, labelMessagesRejected);
        builder.addCase(unlabelMessages.pending, unlabelMessagesPending);
        // builder.addCase(unlabelMessages.rejected, labelMessagesRejected);

        builder.addCase(labelConversations.pending, labelConversationsPending);
        builder.addCase(unlabelConversations.pending, unlabelConversationsPending);
    },
});

export const messagesReducer = { [name]: messagesSlice.reducer };
