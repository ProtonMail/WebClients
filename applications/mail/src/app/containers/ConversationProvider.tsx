import React, { useEffect, createContext, ReactNode } from 'react';
import { useInstance, useEventManager } from 'react-components';
import createCache from 'proton-shared/lib/helpers/cache';
import createLRU from 'proton-shared/lib/helpers/lru';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { omit } from 'proton-shared/lib/helpers/object';

import { Event } from '../models/eventManager';
import { Cache } from '../models/utils';
import { ConversationResult } from '../hooks/useConversation';

export type ConversationCache = Cache<string, ConversationResult>;

/**
 * Context to use to get a reference on the conversation cache
 */
export const ConversationContext = createContext<ConversationCache>(null as any);

/**
 * Event management logic for conversations
 */
const conversationListener = (cache: ConversationCache) => ({ Conversations }: Event) => {
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
        }
    }
};

interface Props {
    children?: ReactNode;
}

/**
 * Provider for the message cache and listen to event manager for updates
 */
const ConversationProvider = ({ children }: Props) => {
    const { subscribe } = useEventManager();

    const cache: ConversationCache = useInstance(() => {
        return createCache(createLRU({ max: 50 } as any));
    });

    useEffect(() => subscribe(conversationListener(cache)), []);

    return <ConversationContext.Provider value={cache}>{children}</ConversationContext.Provider>;
};

export default ConversationProvider;
