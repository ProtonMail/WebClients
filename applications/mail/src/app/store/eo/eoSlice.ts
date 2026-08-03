import { createSlice } from '@reduxjs/toolkit';

import { globalReset } from '../actions';
import {
    EOAddReply,
    EODocumentInitializeFulfilled,
    EODocumentInitializePending,
    EOLoadEmbedded,
    EOLoadRemote,
    init,
    initEncryptedToken,
    loadEOMessage,
    loadEOToken,
} from './eoActions';
import { eoInitialState } from './eoInitialState';
import {
    EOAddReply as EOAddReplyReducer,
    EODocumentInitializeFulfilled as EODocumentInitializeFulfilledReducer,
    EODocumentInitializePending as EODocumentInitializePendingReducer,
    EOLoadEmbeddedFulfilled,
    EOLoadRemote as EOLoadRemoteReducer,
    reset as globalResetReducer,
    initEncryptedToken as initEncryptedTokenReducer,
    initFulfilled,
    loadEOMessageFulfilled,
    loadEOTokenFulfilled,
} from './eoReducers';

export { eoInitialState as initialState } from './eoInitialState';

export const eoSlice = createSlice({
    name: 'eo',
    initialState: eoInitialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, globalResetReducer);

        builder.addCase(init.fulfilled, initFulfilled);
        builder.addCase(initEncryptedToken, initEncryptedTokenReducer);
        builder.addCase(loadEOToken.fulfilled, loadEOTokenFulfilled);
        builder.addCase(loadEOToken.rejected, initEncryptedTokenReducer);
        builder.addCase(loadEOMessage.fulfilled, loadEOMessageFulfilled);

        builder.addCase(EODocumentInitializePending, EODocumentInitializePendingReducer);
        builder.addCase(EODocumentInitializeFulfilled, EODocumentInitializeFulfilledReducer);

        builder.addCase(EOLoadEmbedded.fulfilled, EOLoadEmbeddedFulfilled);

        builder.addCase(EOLoadRemote, EOLoadRemoteReducer);

        builder.addCase(EOAddReply, EOAddReplyReducer);
    },
});

export default eoSlice.reducer;
