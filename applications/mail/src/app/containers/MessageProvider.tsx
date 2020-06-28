import React, { useEffect, createContext, ReactNode, useContext } from 'react';
import { useInstance, useEventManager } from 'react-components';
import { c } from 'ttag';
import createCache, { Cache } from 'proton-shared/lib/helpers/cache';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';

import { Event } from '../models/event';
import { MessageExtended, PartialMessageExtended } from '../models/message';
import { parseLabelIDsInEvent } from '../helpers/elements';
import { mergeMessages } from '../helpers/message/messages';
import { DRAFT_ID_PREFIX } from '../helpers/message/messageDraft';

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
 * Get existing localID in cache for a message ID
 */
export const getLocalID = (cache: MessageCache, messageID: string) => {
    const localID = [...cache.keys()]
        .filter((key) => key.startsWith(DRAFT_ID_PREFIX))
        .find((key) => cache.get(key)?.data?.ID === messageID);

    return localID || messageID;
};

/**
 * Event management logic for messages
 */
const messageEventListener = (cache: MessageCache) => ({ Messages }: Event) => {
    if (!Array.isArray(Messages)) {
        return;
    }

    for (const { ID, Action, Message } of Messages) {
        const localID = getLocalID(cache, ID);

        // Ignore updates for non-fetched messages.
        if (!cache.has(localID)) {
            return;
        }
        if (Action === EVENT_ACTIONS.DELETE) {
            cache.delete(localID);
        }
        if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
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
        return createCache();
    });

    const cache = testCache || realCache;

    useEffect(() => subscribe(messageEventListener(cache)), []);

    useEffect(() => cache.subscribe(messageCacheListener(cache)), []);

    return <MessageContext.Provider value={cache}>{children}</MessageContext.Provider>;
};

export default MessageProvider;
