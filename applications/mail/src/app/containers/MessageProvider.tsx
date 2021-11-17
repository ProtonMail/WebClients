import { useEffect, createContext, ReactNode, useContext } from 'react';
import { DRAFT_ID_PREFIX, isScheduledSend, isSent, isDraft as testIsDraft } from '@proton/shared/lib/mail/messages';
import { useInstance, useEventManager } from '@proton/components';
import createCache, { Cache } from '@proton/shared/lib/helpers/cache';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { Event, LabelIDsChanges } from '../models/event';
import { MessageExtended, PartialMessageExtended } from '../models/message';
import { parseLabelIDsInEvent } from '../helpers/elements';
import { mergeMessages } from '../helpers/message/messages';

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
 * Get existing localID in cache for a message ID
 */
export const getLocalID = (cache: MessageCache, messageID: string) => {
    const localID = [...cache.keys()]
        .filter((key) => key?.startsWith(DRAFT_ID_PREFIX))
        .find((key) => cache.get(key)?.data?.ID === messageID);

    return localID || messageID;
};

/**
 * Event management logic for messages
 */
const messageEventListener =
    (cache: MessageCache) =>
    ({ Messages }: Event) => {
        if (!Array.isArray(Messages)) {
            return;
        }

        for (const { ID, Action, Message } of Messages) {
            const localID = getLocalID(cache, ID);

            // Ignore updates for non-fetched messages.
            if (!cache.has(localID)) {
                continue;
            }
            if (Action === EVENT_ACTIONS.DELETE) {
                cache.delete(localID);
            }
            if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                const currentValue = cache.get(localID) as MessageExtended;
                const isSentDraft = isSent(Message);
                const isScheduled = isScheduledSend(Message);
                const isDraft = testIsDraft(Message);

                if (currentValue.data) {
                    const MessageToUpdate = parseLabelIDsInEvent(
                        currentValue.data,
                        Message as Message & LabelIDsChanges
                    );
                    let removeBody: PartialMessageExtended = {};
                    const flags: Partial<MessageExtended> = {};

                    // Draft updates can contains body updates but will not contains it in the event
                    // By removing the current body value in the cache, we will reload it next time we need it
                    if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
                        if (!currentValue.sending) {
                            removeBody = { initialized: undefined, data: { Body: undefined } };
                        }

                        if (isSentDraft && !isScheduled) {
                            flags.isSentDraft = true;
                        }
                    }

                    // If not a draft, numAttachment will never change, but can be calculated client side for PGP messages
                    if (!isDraft) {
                        delete (MessageToUpdate as Partial<Message>).NumAttachments;
                    }

                    cache.set(localID, {
                        ...currentValue,
                        ...removeBody,
                        ...flags,
                        data: {
                            ...currentValue.data,
                            ...MessageToUpdate,
                            ...removeBody.data,
                        },
                    });
                }
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

    return <MessageContext.Provider value={cache}>{children}</MessageContext.Provider>;
};

export default MessageProvider;
