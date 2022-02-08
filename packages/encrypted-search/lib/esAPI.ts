import { SECOND } from '@proton/shared/lib/constants';
import { Api } from '@proton/shared/lib/interfaces/Api';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getIsOfflineError, getIsTimeoutError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { addESTimestamp, esSentryReport } from './esUtils';
import { ESIndexMetrics, ESSearchMetrics } from './interfaces';

// Error message codes that trigger a retry
const ES_TEMPORARY_ERRORS = [408, 429, 502, 503];

/**
 * Api calls for ES should be transparent and with low priority to avoid jailing
 */
export const apiHelper = async <T>(
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
        // Network and temporary errors trigger a retry, for any other error undefined is returned
        if (
            getIsOfflineError(error) ||
            getIsTimeoutError(error) ||
            error.name === 'NetworkError' ||
            (error?.status && ES_TEMPORARY_ERRORS.includes(error.status))
        ) {
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
 * Send metrics about encrypted search
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
