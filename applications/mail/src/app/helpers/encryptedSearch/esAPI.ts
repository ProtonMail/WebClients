import { apiHelper } from '@proton/encrypted-search';
import { getConversation } from '@proton/shared/lib/api/conversations';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import { getMessage } from '@proton/shared/lib/api/messages';
import type { Api } from '@proton/shared/lib/interfaces';
import type { Message, MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import type { Event } from '../../models/event';

/**
 * Get the latest event or all events since a specified one
 */
export const queryEvents = async (api: Api, lastEvent?: string, signal?: AbortSignal) => {
    if (lastEvent) {
        return apiHelper<Event>({ api, signal, options: getEvents(lastEvent), callingContext: 'getEvents' });
    }
    return apiHelper<Event>({ api, signal, options: getLatestID(), callingContext: 'getLatestID' });
};

/**
 * Fetch one message
 */
export const queryMessage = async (api: Api, messageID: string, signal?: AbortSignal) => {
    const result = await apiHelper<{ Message: Message }>({
        api,
        signal,
        options: getMessage(messageID),
        callingContext: 'getMessage',
    });
    return result?.Message;
};

/**
 * Fetch one conversation
 */
export const queryConversation = async (api: Api, conversationID: string, signal?: AbortSignal) => {
    const result = await apiHelper<{ Messages: (Message | MessageMetadata)[] }>({
        api,
        signal,
        options: getConversation(conversationID),
        callingContext: 'getConversation',
    });
    return result?.Messages;
};
