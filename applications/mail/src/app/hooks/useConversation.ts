import { useEffect, useContext, useState } from 'react';
import { getConversation } from 'proton-shared/lib/api/conversations';
import { useApi, useLoading } from 'react-components';

import { Conversation } from '../models/conversation';
import { Message } from '../models/message';
import { ConversationContext } from '../containers/ConversationProvider';

export interface ConversationResult {
    Conversation: Conversation;
    Messages?: Message[];
}

export const useConversation = (conversationID: string): [ConversationResult | undefined, boolean] => {
    const cache = useContext(ConversationContext);
    const api = useApi();
    const [loading, withLoading] = useLoading(true);
    const [conversation, setConversation] = useState<ConversationResult>(cache.get(conversationID));

    useEffect(() => {
        const load = async () => {
            const result = await api(getConversation(conversationID));
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

    return [conversation, !conversation || loading];
};
