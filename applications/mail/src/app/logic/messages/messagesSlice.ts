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
    errors,
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
    verificationComplete,
    resign,
    optimisticApplyLabels,
    optimisticMarkAs,
    optimisticDelete,
    optimisticEmptyLabel,
    optimisticRestore,
    resetVerification,
    updateScheduled,
    updateExpires,
} from './messagesActions';
import {
    initialize as initializeReducer,
    errors as errorsReducer,
    event as eventReducer,
    loadFulfilled,
    loadRejected,
    verificationComplete as verificationCompleteReducer,
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
    resign as resignReducer,
    optimisticApplyLabels as optimisticApplyLabelsReducer,
    optimisticMarkAs as optimisticMarkAsReducer,
    optimisticDelete as optimisticDeleteReducer,
    optimisticEmptyLabel as optimisticEmptyLabelReducer,
    optimisticRestore as optimisticRestoreReducer,
    resetVerification as resetVerificationReducer,
    reset as globalResetReducer,
    updateScheduled as updateScheduledReducer,
    updateExpires as updateExpiresReducer,
} from './messagesReducers';
import { MessagesState } from './messagesTypes';
import { resetAction as globalReset } from '../actions';

const messagesSlice = createSlice({
    name: 'messages',
    initialState: {} as MessagesState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, globalResetReducer);

        builder.addCase(initialize, initializeReducer);
        builder.addCase(errors, errorsReducer);
        builder.addCase(event, eventReducer);
        builder.addCase(load.fulfilled, loadFulfilled);
        builder.addCase(load.rejected, loadRejected);
        builder.addCase(verificationComplete, verificationCompleteReducer);
        builder.addCase(resign, resignReducer);
        builder.addCase(resetVerification, resetVerificationReducer);

        builder.addCase(documentInitializePending, documentInitializePendingReducer);
        builder.addCase(documentInitializeFulfilled, documentInitializeFulfilledReducer);
        builder.addCase(loadEmbedded.fulfilled, loadEmbeddedFulfilled);
        builder.addCase(loadRemoteProxy.pending, loadRemotePending);
        builder.addCase(loadRemoteProxy.fulfilled, loadRemoteProxyFulFilled);
        builder.addCase(loadFakeProxy.pending, loadRemotePending);
        builder.addCase(loadFakeProxy.fulfilled, loadFakeProxyFulFilled);
        builder.addCase(loadRemoteDirect.pending, loadRemotePending);
        builder.addCase(loadRemoteDirect.fulfilled, loadRemoteDirectFulFilled);

        builder.addCase(optimisticApplyLabels, optimisticApplyLabelsReducer);
        builder.addCase(optimisticMarkAs, optimisticMarkAsReducer);
        builder.addCase(optimisticDelete, optimisticDeleteReducer);
        builder.addCase(optimisticEmptyLabel, optimisticEmptyLabelReducer);
        builder.addCase(optimisticRestore, optimisticRestoreReducer);

        builder.addCase(createDraft, createDraftReducer);
        builder.addCase(openDraft, openDraftReducer);
        builder.addCase(removeInitialAttachments, removeInitialAttachmentsReducer);
        builder.addCase(draftSaved, draftSavedSelector);
        builder.addCase(updateScheduled, updateScheduledReducer);
        builder.addCase(updateExpires, updateExpiresReducer);
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
