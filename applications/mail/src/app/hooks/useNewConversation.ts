import { useContext, useCallback } from 'react';
import { getConversation } from 'proton-shared/lib/api/conversations';
import { useCachedModelResult, useApi } from 'react-components';

import { MessageContext, Cache } from '../containers/MessageProvider';
import { Conversation } from '../models/conversation';
import { Message } from '../models/message';

export type ConversationCache = Cache<string, Conversation>;

interface ConversationResult {
    Conversation: Conversation;
    Messages?: Message[];
}

const getKey = (ID: string) => `Conversation-${ID}`;

export const useConversation = (conversationID: string): [ConversationResult, boolean, any] => {
    // Pretty ugly "reuse" of the MessageCache
    // TODO: either use a different cache or properly handle mix types
    const cache = (useContext(MessageContext) as any) as ConversationCache;
    const api = useApi();

    const miss = useCallback(() => {
        return api(getConversation(conversationID));
    }, [conversationID, api, cache]);

    return useCachedModelResult(cache as any, getKey(conversationID), miss);
};
