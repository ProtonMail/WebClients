import { createSlice } from '@reduxjs/toolkit';

import { globalReset } from '../actions';
import {
    EOAddReply,
    EODocumentInitializeFulfilled,
    EODocumentInitializePending,
    EOLoadEmbedded,
    EOLoadRemote,
    init,
    loadEOMessage,
    loadEOToken,
} from './eoActions';
import {
    EOAddReply as EOAddReplyReducer,
    EODocumentInitializeFulfilled as EODocumentInitializeFulfilledReducer,
    EODocumentInitializePending as EODocumentInitializePendingReducer,
    EOLoadEmbeddedFulfilled,
    EOLoadRemote as EOLoadRemoteReducer,
    reset as globalResetReducer,
    initFulfilled,
    loadEOMessageFulfilled,
    loadEOTokenFulfilled,
} from './eoReducers';
import { EOState } from './eoType';

export const initialState = {
    encryptedToken: '',
    decryptedToken: '',
    isStoreInitialized: false,
    password: '',
} as EOState;

export const eoSlice = createSlice({
    name: 'eo',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, globalResetReducer);

        builder.addCase(init.fulfilled, initFulfilled);
        builder.addCase(loadEOToken.fulfilled, loadEOTokenFulfilled);
        builder.addCase(loadEOMessage.fulfilled, loadEOMessageFulfilled);

        builder.addCase(EODocumentInitializePending, EODocumentInitializePendingReducer);
        builder.addCase(EODocumentInitializeFulfilled, EODocumentInitializeFulfilledReducer);

        builder.addCase(EOLoadEmbedded.fulfilled, EOLoadEmbeddedFulfilled);

        builder.addCase(EOLoadRemote, EOLoadRemoteReducer);

        builder.addCase(EOAddReply, EOAddReplyReducer);
    },
});

export default eoSlice.reducer;
