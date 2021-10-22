import { createSlice } from '@reduxjs/toolkit';
import {
    createDraft,
    deleteDraft,
    documentInitializeFulfilled,
    documentInitializePending,
    endSending,
    endUndo,
    event,
    initialize,
    load,
    loadEmbedded,
    loadRemoteDirect,
    loadFakeProxy,
    loadRemoteProxy,
    openDraft,
    removeInitialAttachments,
    draftSaved,
    sendModifications,
    sent,
    startSending,
} from './messagesActions';
import {
    initialize as initializeReducer,
    event as eventReducer,
    loadFulfilled,
    loadRejected,
    documentInitializePending as documentInitializePendingReducer,
    documentInitializeFulfilled as documentInitializeFulfilledReducer,
    loadEmbeddedFulfilled,
    loadRemotePending,
    loadRemoteDirectFulFilled,
    loadFakeProxyFulFilled,
    loadRemoteProxyFulFilled,
    createDraft as createDraftReducer,
    openDraft as openDraftReducer,
    removeInitialAttachments as removeInitialAttachmentsReducer,
    draftSaved as draftSavedSelector,
    startSending as startSendingReducer,
    sendModifications as sendModificationsReducer,
    endUndo as endUndoReducer,
    sent as sentReducer,
    endSending as endSendingReducer,
    deleteDraft as deleteDraftReducer,
} from './messagesReducer';
import { MessagesState } from './messagesTypes';

const messagesSlice = createSlice({
    name: 'messages',
    initialState: {} as MessagesState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(initialize, initializeReducer);
        builder.addCase(event, eventReducer);
        builder.addCase(load.fulfilled, loadFulfilled);
        builder.addCase(load.rejected, loadRejected);

        builder.addCase(documentInitializePending, documentInitializePendingReducer);
        builder.addCase(documentInitializeFulfilled, documentInitializeFulfilledReducer);
        builder.addCase(loadEmbedded.fulfilled, loadEmbeddedFulfilled);
        builder.addCase(loadRemoteProxy.pending, loadRemotePending);
        builder.addCase(loadRemoteProxy.fulfilled, loadRemoteProxyFulFilled);
        builder.addCase(loadFakeProxy.pending, loadRemotePending);
        builder.addCase(loadFakeProxy.fulfilled, loadFakeProxyFulFilled);
        builder.addCase(loadRemoteDirect.pending, loadRemotePending);
        builder.addCase(loadRemoteDirect.fulfilled, loadRemoteDirectFulFilled);

        builder.addCase(createDraft, createDraftReducer);
        builder.addCase(openDraft, openDraftReducer);
        builder.addCase(removeInitialAttachments, removeInitialAttachmentsReducer);
        builder.addCase(draftSaved, draftSavedSelector);
        builder.addCase(startSending, startSendingReducer);
        builder.addCase(sendModifications, sendModificationsReducer);
        builder.addCase(endUndo, endUndoReducer);
        builder.addCase(sent, sentReducer);
        builder.addCase(endSending, endSendingReducer);
        builder.addCase(deleteDraft, deleteDraftReducer);
    },
});

// Export the reducer, either as a default or named export
export default messagesSlice.reducer;
