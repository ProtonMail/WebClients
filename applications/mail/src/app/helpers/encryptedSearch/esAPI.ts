import { apiHelper } from '@proton/encrypted-search';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import { getMessage } from '@proton/shared/lib/api/messages';
import { Api } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { Event } from '../../models/event';

/**
 * Get the latest event or all events since a specified one
 */
export const queryEvents = async (api: Api, lastEvent?: string, signal?: AbortSignal) => {
    if (lastEvent) {
        return apiHelper<Event>(api, signal, getEvents(lastEvent), 'getEvents');
    }
    return apiHelper<Event>(api, signal, getLatestID(), 'getLatestID');
};

/**
 * Fetch one message
 */
export const queryMessage = async (api: Api, messageID: string, signal?: AbortSignal) => {
    const result = await apiHelper<{ Message: Message }>(api, signal, getMessage(messageID), 'getMessage');
    return result?.Message;
};
