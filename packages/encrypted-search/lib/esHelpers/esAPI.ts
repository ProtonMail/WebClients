import { getLocalKey } from '@proton/shared/lib/api/auth';
import { getIsOfflineError, getIsTimeoutError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getKey } from '@proton/shared/lib/authentication/cryptoHelper';
import { LocalKeyResponse } from '@proton/shared/lib/authentication/interface';
import { getActiveSessionByUserID } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getDecryptedPersistedSessionBlob } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { METRICS_LOG, SECOND } from '@proton/shared/lib/constants';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { base64StringToUint8Array, decodeBase64URL, stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { randomDelay, sendMetricsReport } from '@proton/shared/lib/helpers/metrics';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { Api, User } from '@proton/shared/lib/interfaces';

import { ES_TEMPORARY_ERRORS } from '../constants';
import { readContentProgress, readNumMetadata, readSize } from '../esIDB';
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
 * @param userID the user ID, used only during indexing to store the timestamp of a correctly indexed
 * batch of items and to estimate indexing time
 */
export const apiHelper = async <T>(
    api: Api,
    signal: AbortSignal | undefined,
    options: Object,
    callingContext: string
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

            await wait(retryAfterSeconds * SECOND);

            return apiHelper<T>(api, signal, options, callingContext);
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
type SendESMetrics = {
    (api: Api, Title: 'index', Data: ESIndexMetrics): Promise<void>;
    (api: Api, Title: 'search', Data: ESSearchMetrics): Promise<void>;
};
const sendESMetrics: SendESMetrics = async (api, Title, Data) =>
    sendMetricsReport(api, METRICS_LOG.ENCRYPTED_SEARCH, Title, Data);

/**
 * Generate a pseudorandom user ID unknown to the API
 */
const generateESID = async (api: Api, user: User) => {
    const persistedSession = getActiveSessionByUserID(user.ID, !!user.OrganizationPrivateKey);
    const { UID, blob } = persistedSession || {};
    if (!UID || !blob) {
        return;
    }

    try {
        // Extract the local keyPassword
        const ClientKey = await api<LocalKeyResponse>(withUIDHeaders(UID, getLocalKey())).then(
            ({ ClientKey }) => ClientKey
        );
        const localKey = await getKey(base64StringToUint8Array(ClientKey));
        const { keyPassword } = await getDecryptedPersistedSessionBlob(localKey, blob);

        // Extract a fresh key for HMAC
        const hkdfKey = await crypto.subtle.importKey(
            'raw',
            base64StringToUint8Array(keyPassword).buffer,
            'HKDF',
            false,
            ['deriveKey']
        );
        const hmacKey = await crypto.subtle.deriveKey(
            {
                name: 'HKDF',
                hash: 'SHA-256',
                salt: new Uint8Array(256),
                info: new Uint8Array(),
            },
            hkdfKey,
            {
                name: 'HMAC',
                hash: 'SHA-256',
            },
            false,
            ['sign']
        );

        // HMAC the user ID. The final esID is the first 32-bit of the tag
        return new Uint32Array(
            await crypto.subtle.sign('HMAC', hmacKey, stringToUint8Array(decodeBase64URL(user.ID)))
        )[0];
    } catch (error: any) {
        return;
    }
};

/**
 * Send metrics about the indexing process
 */
export const sendIndexingMetrics = async (api: Api, user: User, isLimited: boolean = false) => {
    const progressBlob = await readContentProgress(user.ID);
    if (!progressBlob) {
        return;
    }

    const esID = await generateESID(api, user);
    if (!esID) {
        return;
    }

    const { totalItems, isRefreshed, numPauses, timestamps, originalEstimate } = progressBlob;
    const { indexTime, totalInterruptions } = estimateIndexingDuration(timestamps);
    const indexSize = await readSize(user.ID);

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
        esID,
        isLimited,
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
    const indexSize = await readSize(userID);

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
