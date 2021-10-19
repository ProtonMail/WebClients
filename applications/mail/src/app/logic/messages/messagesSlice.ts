import { createSlice } from '@reduxjs/toolkit';
import {
    documentInitializeFulfilled,
    documentInitializePending,
    event,
    initialize,
    load,
    loadEmbedded,
    loadRemoteDirect,
    loadFakeProxy,
    loadRemoteProxy,
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
    },
});

// Export the reducer, either as a default or named export
export default messagesSlice.reducer;
