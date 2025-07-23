import { createSlice } from '@reduxjs/toolkit';

import type { MessagesState } from '@proton/mail/store/messages/messagesTypes';

import { globalReset } from '../actions';
import { load as loadElements } from '../elements/elementsActions';
import {
    labelMessages,
    markConversationsAsRead,
    markConversationsAsUnread,
    markMessagesAsRead,
    markMessagesAsUnread,
    unlabelMessages,
} from '../mailbox/mailboxActions';
import * as draftAction from './draft/messagesDraftActions';
import * as draftReducer from './draft/messagesDraftReducers';
import * as expireAction from './expire/messagesExpireActions';
import * as expireReducer from './expire/messagesExpireReducers';
import {
    labelMessagesPending,
    markConversationsAsReadPending,
    markConversationsAsUnreadPending,
    markMessagesAsReadPending,
    markMessagesAsUnreadPending,
    unlabelMessagesPending,
    updateFromElements,
} from './helpers/messagesReducer';
import * as msgImageAction from './images/messagesImagesActions';
import * as msgImageReducer from './images/messagesImagesReducers';
import * as msgOptimisticAction from './optimistic/messagesOptimisticActions';
import * as msgOptimisticReducer from './optimistic/messagesOptimisticReducers';
import * as msgReadAction from './read/messagesReadActions';
import * as msgReadReducer from './read/messagesReadReducers';
import * as scheduledAction from './scheduled/scheduledActions';
import * as scheduledReducer from './scheduled/scheduledReducers';

const name = 'messages';
export const messagesSlice = createSlice({
    name,
    initialState: {} as MessagesState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, msgReadReducer.reset);

        builder.addCase(msgReadAction.initialize, msgReadReducer.initialize);
        builder.addCase(msgReadAction.reload, msgReadReducer.reload);
        builder.addCase(msgReadAction.errors, msgReadReducer.errors);
        builder.addCase(msgReadAction.event, msgReadReducer.event);
        builder.addCase(msgReadAction.load.fulfilled, msgReadReducer.loadFulfilled);
        builder.addCase(msgReadAction.load.rejected, msgReadReducer.loadRejected);
        builder.addCase(msgReadAction.verificationComplete, msgReadReducer.verificationComplete);
        builder.addCase(msgReadAction.resign, msgReadReducer.resign);
        builder.addCase(msgReadAction.resetVerification, msgReadReducer.resetVerification);
        builder.addCase(msgReadAction.applyDarkStyle, msgReadReducer.applyDarkStyle);
        builder.addCase(msgReadAction.removeDarkStyle, msgReadReducer.removeDarkStyle);
        builder.addCase(msgReadAction.documentInitializePending, msgReadReducer.documentInitializePending);
        builder.addCase(msgReadAction.documentInitializeFulfilled, msgReadReducer.documentInitializeFulfilled);
        builder.addCase(msgReadAction.cleanUTMTrackers, msgReadReducer.cleanUTMTrackers);

        builder.addCase(msgImageAction.loadEmbedded.fulfilled, msgImageReducer.loadEmbeddedFulfilled);
        builder.addCase(msgImageAction.loadRemoteProxy.pending, msgImageReducer.loadRemotePending);
        builder.addCase(msgImageAction.loadRemoteProxy.fulfilled, msgImageReducer.loadRemoteProxyFulFilled);
        builder.addCase(msgImageAction.loadFakeProxy.pending, msgImageReducer.loadFakeProxyPending);
        builder.addCase(msgImageAction.loadFakeProxy.fulfilled, msgImageReducer.loadFakeProxyFulFilled);
        builder.addCase(msgImageAction.loadRemoteProxyFromURL, msgImageReducer.loadRemoteProxyFromURL);
        builder.addCase(msgImageAction.loadRemoteDirectFromURL, msgImageReducer.loadRemoteDirectFromURL);
        builder.addCase(msgImageAction.failedRemoteDirectLoading, msgImageReducer.failedRemoteDirectLoading);
        builder.addCase(msgImageAction.loadFakeTrackers, msgImageReducer.loadFakeTrackers);

        builder.addCase(msgOptimisticAction.optimisticApplyLabels, msgOptimisticReducer.optimisticApplyLabels);
        builder.addCase(msgOptimisticAction.optimisticMarkAs, msgOptimisticReducer.optimisticMarkAs);
        builder.addCase(msgOptimisticAction.optimisticDelete, msgOptimisticReducer.optimisticDelete);
        builder.addCase(msgOptimisticAction.optimisticEmptyLabel, msgOptimisticReducer.optimisticEmptyLabel);
        builder.addCase(msgOptimisticAction.optimisticRestore, msgOptimisticReducer.optimisticRestore);

        builder.addCase(draftAction.createDraft, draftReducer.createDraft);
        builder.addCase(draftAction.openDraft, draftReducer.openDraft);
        builder.addCase(draftAction.removeInitialAttachments, draftReducer.removeInitialAttachments);
        builder.addCase(draftAction.updateDraftContent, draftReducer.updateDraftContent);
        builder.addCase(draftAction.draftSaved, draftReducer.draftSaved);
        builder.addCase(draftAction.updateExpires, draftReducer.updateExpires);
        builder.addCase(draftAction.startSending, draftReducer.startSending);
        builder.addCase(draftAction.sendModifications, draftReducer.sendModifications);
        builder.addCase(draftAction.endUndo, draftReducer.endUndo);
        builder.addCase(draftAction.sent, draftReducer.sent);
        builder.addCase(draftAction.endSending, draftReducer.endSending);
        builder.addCase(draftAction.deleteDraft, draftReducer.deleteDraft);
        builder.addCase(draftAction.cancelSendMessage.fulfilled, draftReducer.cancelSendSuccess);

        builder.addCase(expireAction.expireMessages.pending, expireReducer.expirePending);
        builder.addCase(expireAction.expireMessages.fulfilled, expireReducer.expireFullfilled);
        builder.addCase(expireAction.expireMessages.rejected, expireReducer.expireRejected);

        builder.addCase(scheduledAction.updateScheduled, scheduledReducer.updateScheduled);
        builder.addCase(scheduledAction.cancelScheduled, scheduledReducer.cancelScheduled);

        builder.addCase(loadElements.fulfilled, updateFromElements);

        builder.addCase(markMessagesAsRead.pending, markMessagesAsReadPending);
        builder.addCase(markMessagesAsUnread.pending, markMessagesAsUnreadPending);
        builder.addCase(markConversationsAsRead.pending, markConversationsAsReadPending);
        builder.addCase(markConversationsAsUnread.pending, markConversationsAsUnreadPending);

        builder.addCase(labelMessages.pending, labelMessagesPending);
        // builder.addCase(labelMessages.rejected, labelMessagesRejected);
        builder.addCase(unlabelMessages.pending, unlabelMessagesPending);
        // builder.addCase(unlabelMessages.rejected, labelMessagesRejected);
    },
});

export const messagesReducer = { [name]: messagesSlice.reducer };
