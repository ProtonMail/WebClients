import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { getConversation } from '@proton/shared/lib/api/conversations';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { LabelChanges, UnreadStatus } from '../../helpers/labels';
import type { MarkAsChanges } from '../../hooks/optimistic/useOptimisticMarkAs';
import type { Conversation } from '../../models/conversation';
import type { MailThunkExtra } from '../store';
import type {
    ConversationEvent,
    ConversationParams,
    ConversationResult,
    ConversationState,
} from './conversationsTypes';

export const initialize = createAction<ConversationState>('conversations/initialize');

export const load = createAsyncThunk<ConversationResult, ConversationParams, MailThunkExtra>(
    'conversations/load',
    async ({ silentFetch = false, conversationID, messageID }, thunkApi) => {
        try {
            return await thunkApi.extra.api({ ...getConversation(conversationID, messageID), silent: silentFetch });
        } catch (error: any | undefined) {
            console.error(error);
            throw error;
        }
    }
);

export const retryLoading = createAction<{ ID: string }>('conversations/retryLoading');

export const applyLabelsOnConversationMessages = createAction<{
    ID: string;
    messageID: string;
    changes: LabelChanges;
    unreadStatuses: UnreadStatus[] | undefined;
    updatedConversation: Conversation;
    conversationResult: ConversationState;
}>('conversations/optimistic/applyLabels/messages');

export const applyLabelsOnConversation = createAction<{
    ID: string;
    changes: LabelChanges;
    unreadStatuses: UnreadStatus[] | undefined;
}>('conversations/optimistic/applyLabels/conversation');

export const optimisticDelete = createAction<string>('conversations/optimistic/delete/conversation');

export const optimisticDeleteConversationMessages = createAction<{ ID: string; messages: Message[] }>(
    'conversations/optimistic/delete/messages'
);

export const optimisticRestore = createAction<ConversationState[]>('conversations/optimistic/restore');

export const optimisticMarkAsConversationMessages = createAction<{
    ID: string;
    messageID: string;
    updatedConversation: Conversation;
    changes: MarkAsChanges;
}>('conversations/optimistic/markAs/messages');

export const optimisticMarkAsConversation = createAction<{ ID: string; labelID: string; changes: MarkAsChanges }>(
    'conversations/optimistic/markAs/conversation'
);

export const deleteConversation = createAction<string>('conversations/delete');

export const updateConversation = createAction<{ ID: string; updates: Partial<ConversationState> }>(
    'conversations/update'
);

export const eventMessageUpdate = createAction<ConversationEvent>('conversations/event/messages');

export const eventDelete = createAction<string>('conversations/event/delete');

export const eventConversationUpdate = createAction<{ ID: string; updatedConversation: Conversation }>(
    'conversations/event/update'
);
