import { createSlice } from '@reduxjs/toolkit';
import { ConversationsState } from './conversationsTypes';
import {
    applyLabelsOnConversation,
    applyLabelsOnConversationMessages,
    deleteConversation,
    initialize,
    load,
    optimisticDelete,
    optimisticDeleteConversationMessages,
    optimisticRestore,
    retryLoading,
    optimisticMarkAsConversationMessages,
    optimisticMarkAsConversation,
    updateConversation,
    eventDelete,
    eventMessageUpdate,
    eventConversationUpdate,
} from './conversationsActions';
import {
    globalReset as globalResetReducer,
    initialize as initializeReducer,
    loadFulfilled,
    loadRejected,
    retryLoading as retryLoadingReducer,
    applyLabelsOnConversationMessages as applyLabelsOnConversationMessagesReducer,
    applyLabelsOnConversation as applyLabelsOnConversationReducer,
    deleteConversation as deleteConversationReducer,
    optimisticDelete as optimisticDeleteReducer,
    optimisticDeleteConversationMessages as optimisticDeleteConversationMessagesReducer,
    optimisticRestore as optimisticRestoreReducer,
    optimisticMarkAsConversationMessages as optimisticMarkAsConversationMessagesReducer,
    optimisticMarkAsConversation as optimisticMarkAsConversationReducer,
    updateConversation as updateConversationReducer,
    eventMessagesUpdates as eventMessageUpdateReducer,
    eventConversationUpdate as eventConversationUpdateReducer,
} from './conversationsReducers';
import { globalReset } from '../actions';

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
