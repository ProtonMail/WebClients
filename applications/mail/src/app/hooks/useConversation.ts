import { useEffect, useState } from 'react';
import { getConversation } from 'proton-shared/lib/api/conversations';
import { useApi, useLoading } from 'react-components';

import { Conversation } from '../models/conversation';
import { Message } from '../models/message';
import { useConversationCache } from '../containers/ConversationProvider';

export interface ConversationResult {
    Conversation: Conversation;
    Messages?: Message[];
}

export const useConversation = (inputConversationID: string): [string, ConversationResult | undefined, boolean] => {
    const cache = useConversationCache();
    const api = useApi();
    const [conversationID, setConversationID] = useState(inputConversationID);
    const [loading, withLoading] = useLoading(!cache.has(conversationID));
    const [conversation, setConversation] = useState<ConversationResult | undefined>(cache.get(conversationID));

    useEffect(() => {
        const load = async () => {
            const result = (await api(getConversation(inputConversationID))) as ConversationResult;
            cache.set(inputConversationID, result);
        };

        if (!cache.has(inputConversationID)) {
            withLoading(load());
        }

        setConversationID(inputConversationID);
        setConversation(cache.get(inputConversationID));

        return cache.subscribe((changedId: string) => {
            if (inputConversationID === changedId) {
                setConversation(cache.get(inputConversationID));
            }
        });
    }, [inputConversationID, api, cache]);

    return [conversationID, conversation, loading];
};
