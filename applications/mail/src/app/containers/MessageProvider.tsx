import React, { useEffect, createContext, ReactNode, useContext } from 'react';
import { useInstance, useEventManager } from 'react-components';
import { c } from 'ttag';
import createCache from 'proton-shared/lib/helpers/cache';
import createLRU from 'proton-shared/lib/helpers/lru';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';

import { Event } from '../models/event';
import { Cache } from '../models/utils';
import { MessageExtended, PartialMessageExtended, Message } from '../models/message';
import { parseLabelIDsInEvent } from '../helpers/elements';
import { mergeMessages } from '../helpers/message/messages';
import { DRAFT_ID_PREFIX } from '../helpers/message/messageDraft';
import { useExpirationCheck } from '../hooks/useExpiration';
import { identity } from 'proton-shared/lib/helpers/function';

export type MessageCache = Cache<MessageExtended>;

/**
 * Message context containing the Message cache
 */
const MessageContext = createContext<MessageCache>(null as any);

/**
 * Hook returning the Message cache
 */
export const useMessageCache = () => useContext(MessageContext);

/**
 * Common helper to update cache entry with new data
 */
export const updateMessageCache = (
    messageCache: MessageCache,
    localID: string,
    data: PartialMessageExtended
): MessageExtended => {
    const existingMessage = messageCache.get(localID);
    const newMessage = mergeMessages(existingMessage, data);
    messageCache.set(localID, newMessage);
    return newMessage;
};

/**
 * Common helper to only update status
 */
export const updateMessageStatus = (
    messageCache: MessageCache,
    localID: string,
    newStatus: string
): MessageExtended => {
    const existingMessage = messageCache.get(localID) as MessageExtended;
    const newMessage = { ...existingMessage, actionStatus: newStatus };
    messageCache.set(localID, newMessage);
    return newMessage;
};

/**
 * Event management logic for messages
 */
const messageEventListener = (cache: MessageCache) => ({ Messages }: Event) => {
    if (!Array.isArray(Messages)) {
        return;
    }

    for (const { ID, Action, Message } of Messages) {
        let localID = ID;

        // Ignore updates for non-fetched messages.
        if (!cache.has(localID)) {
            // Search in cache for new draft with this ID
            const newDraftLocalID = Object.keys(cache.toObject())
                .filter((key) => key.startsWith(DRAFT_ID_PREFIX))
                .find((key) => cache.get(key)?.data?.ID === ID);

            if (newDraftLocalID) {
                localID = newDraftLocalID;
            } else {
                continue;
            }
        }
        if (Action === EVENT_ACTIONS.DELETE) {
            cache.delete(localID);
        }
        if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
            console.warn('Event type UPDATE_DRAFT on Message not supported', Messages);
        }
        if (Action === EVENT_ACTIONS.UPDATE_FLAGS) {
            const currentValue = cache.get(localID) as MessageExtended;

            if (currentValue.data) {
                const MessageToUpdate = parseLabelIDsInEvent(currentValue.data, Message);

                cache.set(localID, {
                    ...currentValue,
                    data: {
                        ...currentValue.data,
                        ...MessageToUpdate
                    }
                });
            }
        }
    }
};

const messageCacheListener = (cache: MessageCache) => async (changedMessageID: string) => {
    let message = cache.get(changedMessageID);

    if (message && message.actionStatus === undefined && (message.actionQueue?.length || 0) > 0) {
        const actionStatus = c('Info').t`Processing`;
        const [action, ...rest] = message.actionQueue || [];

        cache.set(changedMessageID, { ...message, actionStatus, actionQueue: rest });

        try {
            await action();
        } catch (error) {
            console.error('Message action has failed', error);
        }

        // Message has changed since first read in the cache
        message = cache.get(changedMessageID) as MessageExtended;

        // In case of deletion, message is not in the cache anymore
        if (message) {
            cache.set(changedMessageID, { ...message, actionStatus: undefined });
        }
    }
};

/**
 * Check constantly for expired message in the cache
 */
const useMessageExpirationCheck = (cache: MessageCache) => {
    const messages = Object.values(cache.toObject())
        .map((messageExtended) => messageExtended?.data)
        .filter(identity) as Message[];

    useExpirationCheck(messages, (element) => cache.delete(element.ID || ''));
};

interface Props {
    children?: ReactNode;
    cache?: MessageCache; // Only for testing purposes
}

/**
 * Provider for the message cache and listen to event manager for updates
 */
const MessageProvider = ({ children, cache: testCache }: Props) => {
    const { subscribe } = useEventManager();

    const realCache: MessageCache = useInstance(() => {
        return createCache(createLRU({ max: 50 } as any));
    });

    const cache = testCache || realCache;

    useEffect(() => subscribe(messageEventListener(cache)), []);

    useEffect(() => cache.subscribe(messageCacheListener(cache)), []);

    useMessageExpirationCheck(cache);

    return <MessageContext.Provider value={cache}>{children}</MessageContext.Provider>;
};

export default MessageProvider;
