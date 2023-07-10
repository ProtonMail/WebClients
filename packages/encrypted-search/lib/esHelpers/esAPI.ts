import { getIsOfflineError, getIsTimeoutError, isNotExistError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { METRICS_LOG, SECOND } from '@proton/shared/lib/constants';
import { randomDelay, sendMetricsReport } from '@proton/shared/lib/helpers/metrics';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { Api } from '@proton/shared/lib/interfaces';

import { ES_MAX_RETRIES, ES_TEMPORARY_ERRORS } from '../constants';
import { contentIndexingProgress, readNumMetadata, readSize } from '../esIDB';
import { ESIndexMetrics, ESSearchMetrics } from '../models';
import { estimateIndexingDuration } from './esBuild';

/**
 * Helper to send ES-related sentry reports
 * @param errorMessage the error message that will appear in the title of the log
 * @param extra any other contextual information that will be attached to the log
 */
export const esSentryReport = (errorMessage: string, extra?: any) => {
    captureMessage(`[EncryptedSearch] ${errorMessage}`, { extra });
};

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
export const apiHelper = async <T>(
    api: Api,
    signal: AbortSignal | undefined,
    options: Object,
    callingContext: string,
    retries: number = 1
): Promise<T | undefined> => {
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

        return apiHelper<T>(api, signal, options, callingContext, retries + 1);
    }

    return apiResponse;
};

/**
 * Send metrics about encrypted search
 */
type SendESMetrics = {
    (api: Api, Title: 'index', Data: ESIndexMetrics): Promise<void>;
    (api: Api, Title: 'search', Data: ESSearchMetrics): Promise<void>;
};
const sendESMetrics: SendESMetrics = async (api, Title, Data) =>
    sendMetricsReport(api, METRICS_LOG.ENCRYPTED_SEARCH, Title, Data);

/**
 * Send metrics about the indexing process
 */
export const sendIndexingMetrics = async (api: Api, userID: string) => {
    const progressBlob = await contentIndexingProgress.read(userID);
    if (!progressBlob) {
        return;
    }

    const { totalItems, isRefreshed, numPauses, timestamps, originalEstimate } = progressBlob;
    const { indexTime, totalInterruptions } = estimateIndexingDuration(timestamps);
    const indexSize = (await readSize(userID)) || 0;

    return sendESMetrics(api, 'index', {
        numInterruptions: totalInterruptions - numPauses,
        indexSize,
        originalEstimate,
        indexTime,
        // Note: the metrics dashboard expects a variable called "numMessagesIndexed" but
        // it doesn't make too much sense in general to talk about "messages"
        numMessagesIndexed: totalItems,
        isRefreshed,
        numPauses,
    });
};

/**
 * Send metrics about a single encrypted search
 */
export const sendSearchingMetrics = async (
    api: Api,
    userID: string,
    cacheSize: number,
    searchTime: number,
    isFirstSearch: boolean,
    isCacheLimited: boolean
) => {
    // Note: the metrics dashboard expects a variable called "numMessagesIndexed" but
    // it doesn't make too much sense in general to talk about "messages"
    const numMessagesIndexed = await readNumMetadata(userID);
    if (typeof numMessagesIndexed === 'undefined') {
        // If this is undefined, something went wrong when accessing IDB,
        // therefore it makes little sense to send metrics
        return;
    }
    const indexSize = (await readSize(userID)) || 0;

    return sendESMetrics(api, 'search', {
        indexSize,
        numMessagesIndexed,
        cacheSize,
        searchTime,
        isFirstSearch,
        isCacheLimited,
    });
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
