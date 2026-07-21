import { getIsOfflineError, getIsTimeoutError, isNotExistError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { SECOND } from '@proton/shared/lib/constants';
import { randomDelay } from '@proton/shared/lib/helpers/metrics';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Api } from '@proton/shared/lib/interfaces';

import { ES_MAX_RETRIES, ES_TEMPORARY_ERRORS } from '../constants';
import { readNumMetadata } from '../esIDB/metadata';
import { esSentryReport } from './esReporting';

export { esErrorReport, esSentryReport } from './esReporting';

/**
 * Helper to run api calls for ES. They have the following properties:
 *   - they are transparent to users, i.e. silence is set to true;
 *   - they have low priority to avoid jailing, i.e. the Priority header is set to u=7;
 *   - in case of temporary failuers (i.e. codes 408, 429, 502, 503, NetworkError or TimeoutError)
 *     they are retried (using the retry-after header if present);
 *   - in case of permanent failures (i.e. none of the above), a sentry report is sent with
 *     the EncryptedSearch tag;
 *   - in case a user ID is provided, which should be only during indexing, a blob is stored in
 *     local storage to store the timestamp of a correctly indexed batch of items to estimate indexing time.
 * @param api callback to send api requests
 * @param signal abort signal to interrupt requests
 * @param options the payload and route of the api request
 * @param callingContext contextual information on the caller of this helper. It is used only to
 * include in sentry reports in case of permanent errors
 * @param retries the number of times the same call has already been retried
 */
export const apiHelper = async <T>({
    api,
    signal,
    options,
    callingContext,
    retries = 1,
}: {
    api: Api;
    signal: AbortSignal | undefined;
    options: Object;
    callingContext: string;
    retries?: number;
}): Promise<T | undefined> => {
    if (signal?.aborted) {
        return;
    }

    let apiResponse: T;
    try {
        apiResponse = await api<T>({
            ...options,
            silence: true,
            headers: { Priority: 'u=7' },
            signal,
        });
    } catch (error: any) {
        const isUnknownError =
            !getIsOfflineError(error) &&
            !getIsTimeoutError(error) &&
            error.name !== 'NetworkError' &&
            error.message !== 'Failed to fetch' &&
            error.message !== 'Load failed' &&
            !ES_TEMPORARY_ERRORS.includes(error.status) &&
            error.message !== 'Operation aborted' &&
            error.name !== 'AbortError';

        if (isUnknownError) {
            esSentryReport(`apiHelper: ${callingContext}`, { error });
        }

        if (retries >= ES_MAX_RETRIES || isNotExistError(error)) {
            return;
        }

        const retryAfterSeconds = parseInt(error.response?.headers?.get('retry-after') || '5', 10);
        await wait(retryAfterSeconds * SECOND);

        return apiHelper<T>({ api, signal, options, callingContext, retries: retries + 1 });
    }

    return apiResponse;
};

/**
 * Send a sentry report for when ES is too slow
 * @param userID the user ID
 */
export const sendSlowSearchReport = async (userID: string) => {
    const numItemsIndexed = await readNumMetadata(userID);

    await randomDelay();

    esSentryReport('Search is taking too long', { numItemsIndexed });
};
