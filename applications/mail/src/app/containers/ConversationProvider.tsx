import React, { useEffect, createContext, ReactNode, useContext } from 'react';
import { useInstance, useEventManager, useApi } from 'react-components';
import createCache from 'proton-shared/lib/helpers/cache';
import createLRU from 'proton-shared/lib/helpers/lru';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { omit } from 'proton-shared/lib/helpers/object';

import { Event } from '../models/eventManager';
import { Cache } from '../models/utils';
import { ConversationResult } from '../hooks/useConversation';
import { Api } from 'proton-shared/lib/interfaces';
import { getConversation } from 'proton-shared/lib/api/conversations';

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

    return ({ Conversations }: Event) => {
        if (!Array.isArray(Conversations)) {
            return;
        }

        for (const { ID, Action, Conversation } of Conversations) {
            // Ignore updates for non-fetched messages.
            if (!cache.has(ID)) {
                continue;
            }
            if (Action === EVENT_ACTIONS.DELETE) {
                cache.delete(ID);
            }
            if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
                console.warn('Event type UPDATE_DRAFT on Conversation not supported', Conversations);
            }
            if (Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                const currentValue = cache.get(ID);

                cache.set(ID, {
                    Conversation: {
                        ...currentValue.Conversation,
                        ...omit(Conversation, ['LabelIDsRemoved', 'LabelIDsAdded'])
                    },
                    Messages: currentValue.Messages
                });

                if (Conversation.NumMessages !== currentValue.Messages?.length) {
                    reloadConversation(ID);
                }
            }
        }
    };
};

/**
 * Provider for the message cache and listen to event manager for updates
 */
const ConversationProvider = ({ children }: { children?: ReactNode }) => {
    const { subscribe } = useEventManager();
    const api = useApi();

    const cache: ConversationCache = useInstance(() => {
        return createCache(createLRU({ max: 50 } as any));
    });

    useEffect(() => subscribe(conversationListener(cache, api)), []);

    return <ConversationContext.Provider value={cache}>{children}</ConversationContext.Provider>;
};

export default ConversationProvider;
