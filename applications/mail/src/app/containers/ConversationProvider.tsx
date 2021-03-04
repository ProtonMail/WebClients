import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React, { useEffect, createContext, ReactNode, useContext } from 'react';
import { useInstance, useEventManager, useApi } from 'react-components';
import createCache, { Cache } from 'proton-shared/lib/helpers/cache';
import createLRU from 'proton-shared/lib/helpers/lru';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { Api } from 'proton-shared/lib/interfaces';
import { getConversation } from 'proton-shared/lib/api/conversations';
import { identity } from 'proton-shared/lib/helpers/function';

import { Event, LabelIDsChanges } from '../models/event';
import { ConversationResult } from '../hooks/conversation/useConversation';
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
        const { toCreate, toUpdate, toDelete } = Messages.reduce<{
            toCreate: Message[];
            toUpdate: Message[];
            toDelete: { [ID: string]: boolean };
        }>(
            ({ toCreate, toUpdate, toDelete }, { ID, Action, Message }) => {
                const data = Message && cache.get(Message.ConversationID);

                if (Action === EVENT_ACTIONS.CREATE && data) {
                    toCreate.push(Message as Message);
                } else if ((Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) && data) {
                    toUpdate.push({ ID, ...(Message as Omit<Message, 'ID'>) });
                } else if (Action === EVENT_ACTIONS.DELETE) {
                    toDelete[ID] = true;
                }

                return { toCreate, toUpdate, toDelete };
            },
            { toCreate: [], toUpdate: [], toDelete: {} }
        );

        [...toCreate, ...toUpdate].forEach((messageEvent) => {
            const conversationResult = cache.get(messageEvent.ConversationID) as ConversationResult;
            const messages = conversationResult.Messages || [];
            const isUpdate = messages.some((message) => message.ID === messageEvent.ID);
            let updatedMessages: Message[];

            if (isUpdate) {
                updatedMessages = messages.map((message) => {
                    if (message.ID === messageEvent.ID) {
                        return parseLabelIDsInEvent(message, messageEvent);
                    }
                    return message;
                });
            } else {
                updatedMessages = [...messages, messageEvent];
            }

            cache.set(messageEvent.ConversationID, {
                Conversation: conversationResult.Conversation,
                Messages: updatedMessages,
            });
        });

        if (Object.keys(toDelete).length > 0) {
            cache.forEach((conversationResult) => {
                const updatedMessages = conversationResult.Messages?.filter(({ ID }) => !toDelete[ID]);

                if (conversationResult.Messages?.length !== updatedMessages?.length) {
                    cache.set(conversationResult.Conversation.ID as string, {
                        Conversation: conversationResult.Conversation,
                        Messages: updatedMessages,
                    });
                }
            });
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
                        Conversation as Conversation & LabelIDsChanges
                    );

                    if (updatedConversation.NumMessages !== currentValue.Messages?.length) {
                        void reloadConversation(ID);
                    } else {
                        cache.set(ID, {
                            Conversation: updatedConversation,
                            Messages: currentValue.Messages,
                        });
                    }
                } catch (error) {
                    console.warn('Something went wrong on updating a conversation from an event.', error);
                    void reloadConversation(ID);
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
