import { createSlice } from '@reduxjs/toolkit';

import { globalReset } from '../actions';
import {
    applyLabelsOnConversation,
    applyLabelsOnConversationMessages,
    deleteConversation,
    eventConversationUpdate,
    eventDelete,
    eventMessageUpdate,
    initialize,
    load,
    optimisticDelete,
    optimisticDeleteConversationMessages,
    optimisticMarkAsConversation,
    optimisticMarkAsConversationMessages,
    optimisticRestore,
    retryLoading,
    updateConversation,
} from './conversationsActions';
import {
    applyLabelsOnConversationMessages as applyLabelsOnConversationMessagesReducer,
    applyLabelsOnConversation as applyLabelsOnConversationReducer,
    deleteConversation as deleteConversationReducer,
    eventConversationUpdate as eventConversationUpdateReducer,
    eventMessagesUpdates as eventMessageUpdateReducer,
    globalReset as globalResetReducer,
    initialize as initializeReducer,
    loadFulfilled,
    loadRejected,
    optimisticDeleteConversationMessages as optimisticDeleteConversationMessagesReducer,
    optimisticDelete as optimisticDeleteReducer,
    optimisticMarkAsConversationMessages as optimisticMarkAsConversationMessagesReducer,
    optimisticMarkAsConversation as optimisticMarkAsConversationReducer,
    optimisticRestore as optimisticRestoreReducer,
    retryLoading as retryLoadingReducer,
    updateConversation as updateConversationReducer,
} from './conversationsReducers';
import { ConversationsState } from './conversationsTypes';

const conversationSlice = createSlice({
    name: 'conversations',
    initialState: {} as ConversationsState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, globalResetReducer);
        builder.addCase(initialize, initializeReducer);
        builder.addCase(load.fulfilled, loadFulfilled);
        builder.addCase(load.rejected, loadRejected);
        builder.addCase(retryLoading, retryLoadingReducer);
        builder.addCase(applyLabelsOnConversationMessages, applyLabelsOnConversationMessagesReducer);
        builder.addCase(applyLabelsOnConversation, applyLabelsOnConversationReducer);
        builder.addCase(deleteConversation, deleteConversationReducer);
        builder.addCase(optimisticDelete, optimisticDeleteReducer);
        builder.addCase(optimisticRestore, optimisticRestoreReducer);
        builder.addCase(optimisticDeleteConversationMessages, optimisticDeleteConversationMessagesReducer);
        builder.addCase(optimisticMarkAsConversationMessages, optimisticMarkAsConversationMessagesReducer);
        builder.addCase(optimisticMarkAsConversation, optimisticMarkAsConversationReducer);
        builder.addCase(updateConversation, updateConversationReducer);
        builder.addCase(eventMessageUpdate, eventMessageUpdateReducer);
        builder.addCase(eventDelete, deleteConversationReducer);
        builder.addCase(eventConversationUpdate, eventConversationUpdateReducer);
    },
});

export default conversationSlice.reducer;
