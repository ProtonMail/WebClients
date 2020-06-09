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

export const useConversation = (conversationID: string): [ConversationResult | undefined, boolean] => {
    const cache = useConversationCache();
    const api = useApi();
    const [loading, withLoading] = useLoading(!cache.has(conversationID));
    const [conversation, setConversation] = useState<ConversationResult | undefined>(cache.get(conversationID));

    useEffect(() => {
        const load = async () => {
            const result = (await api(getConversation(conversationID))) as ConversationResult;
            cache.set(conversationID, result);
        };

        if (!cache.has(conversationID)) {
            withLoading(load());
        }

        setConversation(cache.get(conversationID));

        return cache.subscribe((changedId: string) => {
            if (conversationID === changedId) {
                setConversation(cache.get(conversationID));
            }
        });
    }, [conversationID, api, cache]);

    return [conversation, loading];
};
