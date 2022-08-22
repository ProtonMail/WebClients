import { ES_MAX_PARALLEL_ITEMS, apiHelper } from '@proton/encrypted-search';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import { getMessage, queryMessageMetadata } from '@proton/shared/lib/api/messages';
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
 * Fetch metadata for a batch of messages
 */
export const queryMessagesMetadata = async (
    api: Api,
    options: {
        EndID?: string;
        Limit?: number;
        End?: number;
        PageSize?: number;
        Page?: number;
    },
    signal?: AbortSignal,
    userID?: string
) => {
    return apiHelper<{ Total: number; Messages: Message[] }>(
        api,
        signal,
        queryMessageMetadata({
            Limit: ES_MAX_PARALLEL_ITEMS,
            Location: '5',
            Sort: 'Time',
            Desc: 1,
            ...options,
        } as any),
        'queryMessageMetadata',
        userID
    );
};

/**
 * Fetch number of messages
 */
export const queryMessagesCount = async (api: Api, signal?: AbortSignal) => {
    const resultMetadata = await queryMessagesMetadata(api, { Limit: 1, PageSize: 1 }, signal);
    if (!resultMetadata) {
        return;
    }
    return { Total: resultMetadata.Total, firstMessage: resultMetadata.Messages[0] };
};

/**
 * Fetch one message
 */
export const queryMessage = async (api: Api, messageID: string, signal?: AbortSignal) => {
    const result = await apiHelper<{ Message: Message }>(api, signal, getMessage(messageID), 'getMessage');
    return result?.Message;
};
