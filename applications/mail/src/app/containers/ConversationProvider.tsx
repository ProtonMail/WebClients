import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React, { useEffect, createContext, ReactNode, useContext, useCallback } from 'react';
import { useInstance, useEventManager } from 'react-components';
import createCache, { Cache } from 'proton-shared/lib/helpers/cache';
import createLRU from 'proton-shared/lib/helpers/lru';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { identity } from 'proton-shared/lib/helpers/function';
import { Event, LabelIDsChanges } from '../models/event';
import { parseLabelIDsInEvent } from '../helpers/elements';
import { useExpirationCheck } from '../hooks/useExpiration';
import { Conversation, ConversationCacheEntry } from '../models/conversation';
import { mergeConversations } from '../helpers/conversation';
import { LoadConversation, useLoadConversation } from '../hooks/conversation/useLoadConversation';

export type ConversationCache = Cache<string, ConversationCacheEntry>;

/**
 * Conversation context containing the Conversation cache
 */
const ConversationContext = createContext<ConversationCache>(null as any);

/**
 * Hook returning the Conversation cache
 */
export const useConversationCache = () => useContext(ConversationContext);

export type UpdateConversationCache = (
    conversationID: string,
    getData: (cacheEntry: ConversationCacheEntry) => Partial<ConversationCacheEntry>
) => ConversationCacheEntry;

/**
 * Hook to update a conversation cache entry
 */
export const useUpdateConversationCache = (): UpdateConversationCache => {
    const cache = useConversationCache();

    return useCallback(
        (
            conversationID: string,
            getData: (cacheEntry: ConversationCacheEntry) => Partial<ConversationCacheEntry>
        ): ConversationCacheEntry => {
            const existingConversation = cache.get(conversationID);
            const newConversation = mergeConversations(
                existingConversation,
                getData(existingConversation || { loadRetry: 0, errors: {} })
            );
            cache.set(conversationID, newConversation);
            return newConversation;
        },
        []
    );
};

/**
 * Event management logic for conversations
 */
const conversationListener = (cache: ConversationCache, load: LoadConversation, update: UpdateConversationCache) => {
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
            update(messageEvent.ConversationID, ({ Messages = [] }) => {
                const isUpdate = Messages.some((message) => message.ID === messageEvent.ID);
                let updatedMessages: Message[];

                if (isUpdate) {
                    updatedMessages = Messages.map((message) => {
                        if (message.ID === messageEvent.ID) {
                            return parseLabelIDsInEvent(message, messageEvent);
                        }
                        return message;
                    });
                } else {
                    updatedMessages = [...Messages, messageEvent];
                }

                return { Messages: updatedMessages };
            });
        });

        if (Object.keys(toDelete).length > 0) {
            cache.forEach((conversationEntry) => {
                if (conversationEntry.Conversation?.ID && conversationEntry.Messages) {
                    const updatedMessages = conversationEntry.Messages.filter(({ ID }) => !toDelete[ID]);

                    if (conversationEntry.Messages.length !== updatedMessages.length) {
                        update(conversationEntry.Conversation.ID, () => ({
                            Messages: updatedMessages,
                        }));
                    }
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
                const currentValue = cache.get(ID) as ConversationCacheEntry;

                // Try to update the conversation from event data without reloading it
                try {
                    const updatedConversation: Conversation = parseLabelIDsInEvent(
                        currentValue.Conversation || {},
                        Conversation as Conversation & LabelIDsChanges
                    );

                    if (updatedConversation.NumMessages !== currentValue.Messages?.length) {
                        void load(ID, undefined);
                    } else {
                        update(ID, () => ({ Conversation: updatedConversation }));
                    }
                } catch (error) {
                    console.warn('Something went wrong on updating a conversation from an event.', error);
                    void load(ID, undefined);
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
        .map((conversationEntry) => conversationEntry?.Conversation)
        .filter(identity) as Conversation[];

    useExpirationCheck(conversations, (element) => cache.delete(element.ID || ''));
};

const ConversationListener = ({ children }: { children?: ReactNode }) => {
    const cache = useConversationCache();
    const { subscribe } = useEventManager();
    const load = useLoadConversation();
    const updateCache = useUpdateConversationCache();

    useEffect(() => subscribe(conversationListener(cache, load, updateCache)), []);

    useConversationExpirationCheck(cache);

    return <>{children}</>;
};

interface Props {
    children?: ReactNode;
    cache?: ConversationCache; // Only for testing purposes
}

/**
 * Provider for the message cache and listen to event manager for updates
 */
const ConversationProvider = ({ children, cache: testCache }: Props) => {
    const realCache: ConversationCache = useInstance(() => {
        return createCache(
            createLRU<string, ConversationCacheEntry>({ max: 50 })
        );
    });

    const cache = testCache || realCache;

    return (
        <ConversationContext.Provider value={cache}>
            <ConversationListener>{children}</ConversationListener>
        </ConversationContext.Provider>
    );
};

export default ConversationProvider;
