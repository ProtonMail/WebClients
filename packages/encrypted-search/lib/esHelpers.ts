import { ReactNode } from 'react';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import { Api } from '@proton/shared/lib/interfaces/Api';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getIsOfflineError, getIsTimeoutError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import {
    addESTimestamp,
    deferSending,
    getES,
    getNumItemsDB,
    getOldestTimePoint,
    normalizeString,
    removeES,
    setES,
    setOriginalEstimate,
} from './esUtils';
import { ES_TEMPORARY_ERRORS } from './constants';
import { ESIndexingState, HighlightMetadata } from './interfaces';

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
 * Compute the estimated time remaining of indexing
 * @param userID the user ID
 * @param esProgress the number of items processes so far
 * @param esTotal the total number of items to be indexed
 * @param endTime the time when this helper is called
 * @param esState the indexing state, which is a data structure to keep track of
 * indexing progress
 * @returns the number of estimated time to completion and the current progress
 * expressed as a number between 0 and 100
 */
export const estimateIndexingProgress = (
    userID: string,
    esProgress: number,
    esTotal: number,
    endTime: number,
    esState: ESIndexingState
) => {
    let estimatedMinutes = 0;
    let currentProgressValue = 0;

    if (esTotal !== 0 && endTime !== esState.startTime && esProgress !== esState.esPrevProgress) {
        const remainingMessages = esTotal - esProgress;

        setOriginalEstimate(
            userID,
            Math.floor(
                (((endTime - esState.startTime) / (esProgress - esState.esPrevProgress)) * remainingMessages) / SECOND
            )
        );

        estimatedMinutes = Math.ceil(
            (((endTime - esState.startTime) / (esProgress - esState.esPrevProgress)) * remainingMessages) / MINUTE
        );
        currentProgressValue = Math.ceil((esProgress / esTotal) * 100);
    }

    return { estimatedMinutes, currentProgressValue };
};

/**
 * Insert highlighting markers only if a ReactNode is a string or can be parsed as such
 * @param node the react node in which highlight has to be inserted
 * @param highlightMetadata tha callback to the highlightMetadata function returned by the
 * ES library
 * @returns the highlighted node
 */
export const highlightNode = (node: ReactNode, highlightMetadata: HighlightMetadata) => {
    const nodeValue = node?.valueOf();
    if (typeof nodeValue === 'string') {
        return highlightMetadata(nodeValue).resultJSX;
    }
    if (
        !!nodeValue &&
        Object.prototype.isPrototypeOf.call(Object.prototype, nodeValue) &&
        Object.prototype.hasOwnProperty.call(nodeValue, 'props')
    ) {
        const { props } = nodeValue as { props: any };
        if (
            Object.prototype.isPrototypeOf.call(Object.prototype, props) &&
            Object.prototype.hasOwnProperty.call(props, 'children')
        ) {
            const { children } = props;
            if (Array.isArray(props.children) && children.every((child: any) => typeof child === 'string')) {
                return highlightMetadata(children.join('')).resultJSX;
            }
        }
    }
    return node;
};

/**
 * Process the string input by the user in the searchbar by performing the following
 * transformations:
 *   - trims whitespaces from the input string;
 *   - removes diacritics;
 *   - casts to locale lower case;
 *   - splits the input string in multiple keywords if separated by whitespace, unless
 *     it's within quotes
 * @param keyword the string as input by users in the searchbar
 * @returns the array of normalised keywords to be searched
 */
export const normalizeKeyword = (keyword: string) => {
    const trimmedKeyword = normalizeString(keyword);
    const quotesIndexes: number[] = [];

    let index = 0;
    while (index !== -1) {
        index = trimmedKeyword.indexOf(`"`, index);
        if (index !== -1) {
            quotesIndexes.push(index);
            index++;
        }
    }

    const normalizedKeywords: string[] = [];
    let previousIndex = -1;
    for (let index = 0; index < quotesIndexes.length; index++) {
        const keyword = trimmedKeyword.slice(previousIndex + 1, quotesIndexes[index]);

        if (index % 2 === 1) {
            // If the user placed quotes, we want to keep everything inside as a single block
            normalizedKeywords.push(keyword);
        } else {
            // Otherwise we split by whitespace
            normalizedKeywords.push(...keyword.split(' '));
        }

        previousIndex = quotesIndexes[index];
    }

    normalizedKeywords.push(...trimmedKeyword.slice(quotesIndexes[quotesIndexes.length - 1] + 1).split(' '));

    return normalizedKeywords.filter(isTruthy);
};

/**
 * Check if all given keywords are in any of the given strings. In other words, all given
 * keywords should be included in at least one of the searched strings
 * @param normalizedKeywords keywords to search
 * @param stringsToSearch string to be searched
 * @returns whether all keywords can be found in at least one given string
 */
export const testKeywords = (normalizedKeywords: string[], stringsToSearch: string[]) => {
    const normalizedStrings = stringsToSearch.map((str) => normalizeString(str));
    let result = true;
    let index = 0;
    while (result && index !== normalizedKeywords.length) {
        const keyword = normalizedKeywords[index];
        result = result && normalizedStrings.some((string) => string.includes(keyword));
        index++;
    }

    return result;
};

/**
 * Send a sentry report for when ES is too slow
 * @param userID the user ID
 * @param storeName the name of the object store inside IndexedDB
 */
export const sendSlowSearchReport = async (userID: string, storeName: string) => {
    const numItemsIndexed = await getNumItemsDB(userID, storeName);

    await deferSending();

    esSentryReport('Search is taking too long', { numItemsIndexed });
};

/**
 * @returns three helpers to get, set or remove blobs in local storage related to ES.
 * The accessible blobs are the following.
 * @var Key the LS blob storing the symmetric index key
 * @var Event the LS blob storing the last event ID to which the IDB was synced
 * @var Progress the LS blob storing an object describing the progress of indexing
 * @var Size the LS blob storing an estimated size in bytes of IDB
 * @var Pause the LS blob storing whether a paused indexing exists
 * @var Enabled the LS blob storing whether ES is enabled or disabled
 */
export const esStorageHelpers = () => ({
    getES,
    setES,
    removeES,
});

/**
 * @param userID the user ID
 * @return whether the symmetric index key under which IDB is encrypted exists
 */
export const indexKeyExists = (userID: string) => !!getES.Key(userID);

/**
 * @param userID the user ID
 * @returns whether a previously started indexing process has terminated successfully
 */
export const isDBReadyAfterBuilding = (userID: string) => !getES.Progress(userID);

/**
 * @param userID the user ID
 * @returns whether a key exists and the corresponding indexing process has terminated successfully
 */
export const wasIndexingDone = (userID: string) => indexKeyExists(userID) && isDBReadyAfterBuilding(userID);

/**
 * Get the time of the oldest item from IDB, eventually corrected by a given factor
 * @param userID the user ID
 * @param storeName the name of the object store
 * @param indexName the name of the temporal index
 * @param getTimePoint a callback to extract the timepoint from an encrypted item
 * @param correctionFactor a multiplicative factor
 * @returns time of the oldest item in IDB, potentially corrected
 */
export const getOldestTime = async <ESCiphertext>(
    userID: string,
    storeName: string,
    indexName: string,
    getTimePoint: (item: ESCiphertext) => [number, number],
    correctionFactor?: number
) => {
    const timePoint = await getOldestTimePoint<ESCiphertext>(userID, storeName, indexName, getTimePoint);
    return timePoint ? timePoint[0] * (correctionFactor || 1) : 0;
};

/**
 * @param userID the user ID
 * @returns the number of items in the account when indexing had started, i.e.
 * excluding those that have changed since then
 */
export const getESTotal = (userID: string) => {
    return getES.Progress(userID)?.totalItems || 0;
};

/**
 * @param userID the user ID
 * @returns the indexing progress expressed as a number between 0 and 100 from BuildProgress
 */
export const getESCurrentProgress = (userID: string) => {
    const progressBlob = getES.Progress(userID);
    if (!progressBlob) {
        return 0;
    }
    const { currentItems, totalItems } = progressBlob;
    return Math.ceil(((currentItems || 0) / totalItems) * 100);
};
