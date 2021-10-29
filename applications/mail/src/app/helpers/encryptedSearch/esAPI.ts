import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { Api } from '@proton/shared/lib/interfaces';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import { getMessage, queryMessageMetadata } from '@proton/shared/lib/api/messages';
import { wait } from '@proton/shared/lib/helpers/promise';
import { SECOND } from '@proton/shared/lib/constants';
import { Event } from '../../models/event';
import { ES_MAX_PARALLEL_MESSAGES } from '../../constants';
import { addESTimestamp, esSentryReport } from './esUtils';
import { isNetworkError, isNotExistError } from '../errors';
import { ESIndexMetrics, ESSearchMetrics } from '../../models/encryptedSearch';

// Error message codes that trigger a retry
const ES_TEMPORARY_ERRORS = [408, 429, 502, 503];

/**
 * Api calls for ES should be transparent and with low priority to avoid jailing
 */
const apiHelper = async <T>(
    api: Api,
    signal: AbortSignal | undefined,
    options: Object,
    callingContext: string,
    userID?: string
): Promise<T | undefined> => {
    let apiResponse: T;
    try {
        apiResponse = await api<T>({
            ...options,
            silence: true,
            headers: { Priority: 'u=7' },
            signal,
        });
    } catch (error: any) {
        // If the message does not exist it means it's been deleted. By returning undefined its metadata
        // will be stored anyway if this happens during indexing, but when new events are caught up after it
        // they should be removed. If this happens during syncing, the message is ignored
        if (isNotExistError(error)) {
            return;
        }

        // Network and temporary errors trigger a retry, for any other error undefined is returned
        if (isNetworkError(error) || (error?.status && ES_TEMPORARY_ERRORS.includes(error.status))) {
            let retryAfterSeconds = 1;

            const { response } = error;
            if (response) {
                const { headers } = response;
                retryAfterSeconds = headers ? parseInt(headers.get('retry-after') || '1', 10) : retryAfterSeconds;
            }

            if (userID) {
                addESTimestamp(userID, 'stop');
            }

            await wait(retryAfterSeconds * SECOND);

            return apiHelper<T>(api, signal, options, callingContext, userID);
        }

        if (!(error.message && error.message === 'Operation aborted') && !(error.name && error.name === 'AbortError')) {
            // This happens when the user pauses indexing, for which we don't need a sentry report
            esSentryReport(`apiHelper: ${callingContext}`, { error });
        }
        return;
    }

    return apiResponse;
};

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
            Limit: ES_MAX_PARALLEL_MESSAGES,
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
export const queryMessage = async (api: Api, messageID: string, signal?: AbortSignal, userID?: string) => {
    const result = await apiHelper<{ Message: Message }>(api, signal, getMessage(messageID), 'getMessage', userID);
    return result?.Message;
};

/**
 * Send metrics about encrypted search usage
 */
export const sendESMetrics = async (api: Api, Title: string, Data: ESSearchMetrics | ESIndexMetrics) => {
    return apiHelper<{ Code: number }>(
        api,
        undefined,
        {
            method: 'post',
            url: 'metrics',
            data: { Log: 'encrypted_search', Title, Data },
        },
        'metrics'
    );
};
