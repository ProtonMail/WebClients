import { createSlice } from '@reduxjs/toolkit';
import {
    documentInitializeFulfilled,
    documentInitializePending,
    event,
    initialize,
    errors,
    load,
    verificationComplete,
    resign,
    resetVerification,
    applyDarkStyle,
    removeDarkStyle,
} from './read/messagesReadActions';
import { loadEmbedded, loadFakeProxy, loadRemoteDirect, loadRemoteProxy } from './images/messagesImagesActions';
import {
    optimisticApplyLabels,
    optimisticMarkAs,
    optimisticDelete,
    optimisticEmptyLabel,
    optimisticRestore,
} from './optimistic/messagesOptimisticActions';
import {
    createDraft,
    deleteDraft,
    endSending,
    endUndo,
    openDraft,
    removeInitialAttachments,
    draftSaved,
    sendModifications,
    sent,
    startSending,
    updateScheduled,
    updateExpires,
    cancelScheduled,
} from './draft/messagesDraftActions';
import {
    initialize as initializeReducer,
    errors as errorsReducer,
    event as eventReducer,
    loadFulfilled,
    loadRejected,
    verificationComplete as verificationCompleteReducer,
    documentInitializePending as documentInitializePendingReducer,
    documentInitializeFulfilled as documentInitializeFulfilledReducer,
    resign as resignReducer,
    resetVerification as resetVerificationReducer,
    reset as globalResetReducer,
    applyDarkStyle as applyDarkStyleReducer,
    removeDarkStyle as removeDarkStyleReducer,
} from './read/messagesReadReducers';
import {
    loadEmbeddedFulfilled,
    loadRemotePending,
    loadRemoteDirectFulFilled,
    loadFakeProxyFulFilled,
    loadRemoteProxyFulFilled,
    loadFakeProxyPending,
} from './images/messagesImagesReducers';
import {
    optimisticApplyLabels as optimisticApplyLabelsReducer,
    optimisticMarkAs as optimisticMarkAsReducer,
    optimisticDelete as optimisticDeleteReducer,
    optimisticEmptyLabel as optimisticEmptyLabelReducer,
    optimisticRestore as optimisticRestoreReducer,
} from './optimistic/messagesOptimisticReducers';
import {
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
    updateScheduled as updateScheduledReducer,
    updateExpires as updateExpiresReducer,
    cancelScheduled as cancelScheduledReducer,
} from './draft/messagesDraftReducers';
import { MessagesState } from './messagesTypes';
import { globalReset } from '../actions';

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
        builder.addCase(applyDarkStyle, applyDarkStyleReducer);
        builder.addCase(removeDarkStyle, removeDarkStyleReducer);

        builder.addCase(documentInitializePending, documentInitializePendingReducer);
        builder.addCase(documentInitializeFulfilled, documentInitializeFulfilledReducer);
        builder.addCase(loadEmbedded.fulfilled, loadEmbeddedFulfilled);
        builder.addCase(loadRemoteProxy.pending, loadRemotePending);
        builder.addCase(loadRemoteProxy.fulfilled, loadRemoteProxyFulFilled);
        builder.addCase(loadFakeProxy.pending, loadFakeProxyPending);
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
        builder.addCase(cancelScheduled, cancelScheduledReducer);
    },
});

// Export the reducer, either as a default or named export
export default messagesSlice.reducer;
