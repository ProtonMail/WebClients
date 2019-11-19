import { useApi } from 'react-components';
import { useCallback } from 'react';
import { getConversation as queryConversation, queryConversations } from 'proton-shared/lib/api/conversations';
import { Conversation } from '../models/conversation';
import { Message } from '../models/message';

export const useConversations = () => {
    const api = useApi();

    const getConversation = useCallback(
        async (
            conversationID: string,
            messageID?: string
        ): Promise<{ Conversation: Conversation; Messages: Message[] }> => {
            return api(queryConversation(conversationID, messageID));
        },
        [api]
    );

    const getConversations = useCallback(
        async (LabelID: string): Promise<{ Conversations: Conversation[] }> => {
            return api(queryConversations({ LabelID } as any));
        },
        [api]
    );

    return { getConversation, getConversations };
};
