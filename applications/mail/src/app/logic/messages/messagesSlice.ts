import { createSlice } from '@reduxjs/toolkit';

import { globalReset } from '../actions';
import {
    cancelScheduled,
    createDraft,
    deleteDraft,
    draftSaved,
    endSending,
    endUndo,
    openDraft,
    removeInitialAttachments,
    sendModifications,
    sent,
    startSending,
    updateExpires,
    updateScheduled,
} from './draft/messagesDraftActions';
import {
    cancelScheduled as cancelScheduledReducer,
    createDraft as createDraftReducer,
    deleteDraft as deleteDraftReducer,
    draftSaved as draftSavedSelector,
    endSending as endSendingReducer,
    endUndo as endUndoReducer,
    openDraft as openDraftReducer,
    removeInitialAttachments as removeInitialAttachmentsReducer,
    sendModifications as sendModificationsReducer,
    sent as sentReducer,
    startSending as startSendingReducer,
    updateExpires as updateExpiresReducer,
    updateScheduled as updateScheduledReducer,
} from './draft/messagesDraftReducers';
import { loadEmbedded, loadFakeProxy, loadRemoteDirect, loadRemoteProxy } from './images/messagesImagesActions';
import {
    loadEmbeddedFulfilled,
    loadFakeProxyFulFilled,
    loadFakeProxyPending,
    loadRemoteDirectFulFilled,
    loadRemotePending,
    loadRemoteProxyFulFilled,
} from './images/messagesImagesReducers';
import { MessagesState } from './messagesTypes';
import {
    optimisticApplyLabels,
    optimisticDelete,
    optimisticEmptyLabel,
    optimisticMarkAs,
    optimisticRestore,
} from './optimistic/messagesOptimisticActions';
import {
    optimisticApplyLabels as optimisticApplyLabelsReducer,
    optimisticDelete as optimisticDeleteReducer,
    optimisticEmptyLabel as optimisticEmptyLabelReducer,
    optimisticMarkAs as optimisticMarkAsReducer,
    optimisticRestore as optimisticRestoreReducer,
} from './optimistic/messagesOptimisticReducers';
import {
    applyDarkStyle,
    documentInitializeFulfilled,
    documentInitializePending,
    errors,
    event,
    initialize,
    load,
    reload,
    removeDarkStyle,
    resetVerification,
    resign,
    verificationComplete,
} from './read/messagesReadActions';
import {
    applyDarkStyle as applyDarkStyleReducer,
    documentInitializeFulfilled as documentInitializeFulfilledReducer,
    documentInitializePending as documentInitializePendingReducer,
    errors as errorsReducer,
    event as eventReducer,
    reset as globalResetReducer,
    initialize as initializeReducer,
    loadFulfilled,
    loadRejected,
    reload as reloadReducer,
    removeDarkStyle as removeDarkStyleReducer,
    resetVerification as resetVerificationReducer,
    resign as resignReducer,
    verificationComplete as verificationCompleteReducer,
} from './read/messagesReadReducers';

const messagesSlice = createSlice({
    name: 'messages',
    initialState: {} as MessagesState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, globalResetReducer);

        builder.addCase(initialize, initializeReducer);
        builder.addCase(reload, reloadReducer);
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
