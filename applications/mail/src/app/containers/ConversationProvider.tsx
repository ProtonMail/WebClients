import React, { useEffect, createContext, ReactNode, useContext } from 'react';
import { useInstance, useEventManager, useApi } from 'react-components';
import createCache, { Cache } from 'proton-shared/lib/helpers/cache';
import createLRU from 'proton-shared/lib/helpers/lru';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { Api } from 'proton-shared/lib/interfaces';
import { getConversation } from 'proton-shared/lib/api/conversations';
import { identity } from 'proton-shared/lib/helpers/function';

import { Event } from '../models/event';
import { ConversationResult } from '../hooks/useConversation';
import { parseLabelIDsInEvent } from '../helpers/elements';
import { useExpirationCheck } from '../hooks/useExpiration';
import { Conversation } from '../models/conversation';

export type ConversationCache = Cache<string, ConversationResult>;

/**
 * Conversation context containing the Conversation cache
 */
const ConversationContext = createContext<ConversationCache>(null as any);

/**
 * Hook returning the Conversation cache
 */
export const useConversationCache = () => useContext(ConversationContext);

/**
 * Event management logic for conversations
 */
const conversationListener = (cache: ConversationCache, api: Api) => {
    const reloadConversation = async (ID: string) => {
        const result = (await api(getConversation(ID))) as ConversationResult;
        cache.set(ID, result);
    };

    return ({ Conversations = [], Messages = [] }: Event) => {
        for (const { ID, Action, Message } of Messages) {
            if (!Message || !Message.ConversationID) {
                continue;
            }

            const data = cache.get(Message.ConversationID);

            // Ignore updates for non-fetched conversations
            if (!data || !data.Messages) {
                continue;
            }

            const messages = data.Messages || [];
            const index = messages.findIndex((currentMessage) => currentMessage.ID === ID);

            // Ignore updates for not found message
            if (index === -1) {
                continue;
            }
            if (Action === EVENT_ACTIONS.DELETE) {
                messages.splice(index, 1);
            }
            if (Action === EVENT_ACTIONS.CREATE) {
                messages.push(Message);
            }
            if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                messages[index] = {
                    ...messages[index],
                    ...parseLabelIDsInEvent(messages[index], Message)
                };
            }

            cache.set(Message.ConversationID, { Conversation: data?.Conversation || {}, Messages: messages });
        }

        for (const { ID, Action, Conversation } of Conversations) {
            // Ignore updates for non-fetched conversations.
            if (!cache.has(ID)) {
                continue;
            }
            if (Action === EVENT_ACTIONS.DELETE) {
                cache.delete(ID);
            }
            if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                const currentValue = cache.get(ID) as ConversationResult;

                // Try to update the conversation from event data without reloading it
                try {
                    const updatedConversation: Conversation = parseLabelIDsInEvent(
                        currentValue.Conversation,
                        Conversation
                    );

                    if (updatedConversation.NumMessages !== currentValue.Messages?.length) {
                        reloadConversation(ID);
                    } else {
                        cache.set(ID, {
                            Conversation: updatedConversation,
                            Messages: currentValue.Messages
                        });
                    }
                } catch (error) {
                    console.warn('Something went wrong on updating a conversation from an event.', error);
                    reloadConversation(ID);
                }
            }
        }
    };
};

/**
 * Check constantly for expired message in the cache
 */
const useConversationExpirationCheck = (cache: ConversationCache) => {
    const conversations = [...cache.values()]
        .map((conversationResult) => conversationResult?.Conversation)
        .filter(identity) as Conversation[];

    useExpirationCheck(conversations, (element) => cache.delete(element.ID || ''));
};

interface Props {
    children?: ReactNode;
    cache?: ConversationCache; // Only for testing purposes
}

/**
 * Provider for the message cache and listen to event manager for updates
 */
const ConversationProvider = ({ children, cache: testCache }: Props) => {
    const { subscribe } = useEventManager();
    const api = useApi();

    const realCache: ConversationCache = useInstance(() => {
        return createCache(
            createLRU<string, ConversationResult>({ max: 50 })
        );
    });

    const cache = testCache || realCache;

    useEffect(() => subscribe(conversationListener(cache, api)), []);

    useConversationExpirationCheck(cache);

    return <ConversationContext.Provider value={cache}>{children}</ConversationContext.Provider>;
};

export default ConversationProvider;
