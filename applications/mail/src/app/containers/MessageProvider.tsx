import React, { useEffect, createContext, ReactNode, useContext } from 'react';
import { useInstance, useEventManager } from 'react-components';
import createCache from 'proton-shared/lib/helpers/cache';
import createLRU from 'proton-shared/lib/helpers/lru';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';

import { Event } from '../models/event';
import { Cache } from '../models/utils';
import { MessageExtended } from '../models/message';
import { parseLabelIDsInEvent } from '../helpers/elements';

export type MessageCache = Cache<string, MessageExtended>;

/**
 * Message context containing the Message cache
 */
const MessageContext = createContext<MessageCache>(null as any);

/**
 * Hook returning the Message cache
 */
export const useMessageCache = () => useContext(MessageContext);

/**
 * Event management logic for messages
 */
const messageListener = (cache: MessageCache) => ({ Messages }: Event) => {
    if (!Array.isArray(Messages)) {
        return;
    }

    for (const { ID, Action, Message } of Messages) {
        // Ignore updates for non-fetched messages.
        if (!cache.has(ID)) {
            continue;
        }
        if (Action === EVENT_ACTIONS.DELETE) {
            cache.delete(ID);
        }
        if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
            console.warn('Event type UPDATE_DRAFT on Message not supported', Messages);
        }
        if (Action === EVENT_ACTIONS.UPDATE_FLAGS) {
            const currentValue = cache.get(ID);

            const MessageToUpdate = parseLabelIDsInEvent(currentValue.data, Message);

            cache.set(ID, {
                ...currentValue,
                data: {
                    ...currentValue.data,
                    ...MessageToUpdate
                }
            });
        }
    }
};

/**
 * Provider for the message cache and listen to event manager for updates
 */
const MessageProvider = ({ children }: { children?: ReactNode }) => {
    const { subscribe } = useEventManager();

    const cache: MessageCache = useInstance(() => {
        return createCache(createLRU({ max: 50 } as any));
    });

    useEffect(() => subscribe(messageListener(cache)), []);

    return <MessageContext.Provider value={cache}>{children}</MessageContext.Provider>;
};

export default MessageProvider;
