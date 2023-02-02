import { createSlice } from '@reduxjs/toolkit';

import { globalReset } from '../actions';
import { load as loadElements } from '../elements/elementsActions';
import * as draftAction from './draft/messagesDraftActions';
import * as draftReducer from './draft/messagesDraftReducers';
import { updateFromElements } from './helpers/messagesReducer';
import * as msgImageAction from './images/messagesImagesActions';
import * as msgImageReducer from './images/messagesImagesReducers';
import { MessagesState } from './messagesTypes';
import * as msgOptimisticAction from './optimistic/messagesOptimisticActions';
import * as msgOptimisticReducer from './optimistic/messagesOptimisticReducers';
import * as msgReadAction from './read/messagesReadActions';
import * as msgReadReducer from './read/messagesReadReducers';
import * as scheduledAction from './scheduled/scheduledActions';
import * as scheduledReducer from './scheduled/scheduledReducers';

const messagesSlice = createSlice({
    name: 'messages',
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

        builder.addCase(msgImageAction.loadEmbedded.fulfilled, msgImageReducer.loadEmbeddedFulfilled);
        builder.addCase(msgImageAction.loadRemoteProxy.pending, msgImageReducer.loadRemotePending);
        builder.addCase(msgImageAction.loadRemoteProxy.fulfilled, msgImageReducer.loadRemoteProxyFulFilled);
        builder.addCase(msgImageAction.loadFakeProxy.pending, msgImageReducer.loadFakeProxyPending);
        builder.addCase(msgImageAction.loadFakeProxy.fulfilled, msgImageReducer.loadFakeProxyFulFilled);
        builder.addCase(msgImageAction.loadRemoteProxyFromURL, msgImageReducer.loadRemoteProxyFromURL);
        builder.addCase(msgImageAction.loadRemoteDirectFromURL, msgImageReducer.loadRemoteDirectFromURL);

        builder.addCase(msgOptimisticAction.optimisticApplyLabels, msgOptimisticReducer.optimisticApplyLabels);
        builder.addCase(msgOptimisticAction.optimisticMarkAs, msgOptimisticReducer.optimisticMarkAs);
        builder.addCase(msgOptimisticAction.optimisticDelete, msgOptimisticReducer.optimisticDelete);
        builder.addCase(msgOptimisticAction.optimisticEmptyLabel, msgOptimisticReducer.optimisticEmptyLabel);
        builder.addCase(msgOptimisticAction.optimisticRestore, msgOptimisticReducer.optimisticRestore);

        builder.addCase(draftAction.createDraft, draftReducer.createDraft);
        builder.addCase(draftAction.openDraft, draftReducer.openDraft);
        builder.addCase(draftAction.removeInitialAttachments, draftReducer.removeInitialAttachments);
        builder.addCase(draftAction.removeQuickReplyFlag, draftReducer.removeQuickReplyFlag);
        builder.addCase(draftAction.removeAllQuickReplyFlags, draftReducer.removeAllQuickReplyFlags);
        builder.addCase(draftAction.updateIsSavingFlag, draftReducer.updateIsSavingFlag);
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

        builder.addCase(scheduledAction.updateScheduled, scheduledReducer.updateScheduled);
        builder.addCase(scheduledAction.cancelScheduled, scheduledReducer.cancelScheduled);

        builder.addCase(loadElements.fulfilled, updateFromElements);
    },
});

// Export the reducer, either as a default or named export
export default messagesSlice.reducer;
