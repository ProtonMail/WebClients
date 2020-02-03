import React, { useEffect, createContext, ReactNode } from 'react';
import { useInstance, useEventManager } from 'react-components';
import createCache from 'proton-shared/lib/helpers/cache';
import createLRU from 'proton-shared/lib/helpers/lru';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { diff } from 'proton-shared/lib/helpers/array';
import { omit } from 'proton-shared/lib/helpers/object';

import { Event } from '../models/eventManager';
import { Cache } from '../models/utils';
import { MessageExtended } from '../models/message';

export type MessageCache = Cache<string, MessageExtended>;

/**
 * Context to use to get a reference on the message cache
 */
export const MessageContext = createContext<MessageCache>(null as any);

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
            const messageEventData = Message;

            const LabelIDs = diff(currentValue.data?.LabelIDs || [], messageEventData.LabelIDsRemoved || []).concat(
                messageEventData.LabelIDsAdded
            );
            const MessageToUpdate = omit(Message, ['LabelIDsRemoved', 'LabelIDsAdded']);

            cache.set(ID, {
                ...currentValue,
                data: {
                    ...currentValue.data,
                    LabelIDs,
                    ...MessageToUpdate
                }
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
const MessageProvider = ({ children }: Props) => {
    const { subscribe } = useEventManager();

    const cache: MessageCache = useInstance(() => {
        return createCache(createLRU({ max: 50 } as any));
    });

    useEffect(() => subscribe(messageListener(cache)), []);

    return <MessageContext.Provider value={cache}>{children}</MessageContext.Provider>;
};

export default MessageProvider;
