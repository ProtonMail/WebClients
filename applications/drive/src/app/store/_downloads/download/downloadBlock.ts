import { createReadableStreamWrapper } from '@mattiasbuelens/web-streams-adapter';
import { ReadableStream } from 'web-streams-polyfill';

import { retryHandler } from '@proton/shared/lib/api/helpers/withApiHandlers';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { DOWNLOAD_RETRIES_ON_TIMEOUT, DOWNLOAD_TIMEOUT, RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { createApiError, createOfflineError } from '@proton/shared/lib/fetch/ApiError';

import { MAX_TOO_MANY_REQUESTS_WAIT } from '../constants';

const toPolyfillReadable = createReadableStreamWrapper(ReadableStream);

export default async function downloadBlock(
    abortController: AbortController,
    url: string,
    token: string
): Promise<ReadableStream<Uint8Array>> {
    const doFetch = async (attempt = 0): Promise<Response> => {
        let isTimeout = false;
        const timeoutController = new AbortController();
        const timeoutHandle = setTimeout(() => {
            isTimeout = true;
            abortController.abort();
        }, DOWNLOAD_TIMEOUT);
        const signalAbortHandle = () => {
            timeoutController.abort();
            clearTimeout(timeoutHandle);
        };
        abortController.signal.addEventListener('abort', signalAbortHandle);
        const cleanListeners = () => {
            clearTimeout(timeoutHandle);
            abortController.signal.removeEventListener('abort', signalAbortHandle);
        };

        return fetch(url, {
            signal: abortController.signal,
            method: 'get',
            credentials: 'omit',
            headers: {
                'pm-storage-token': token,
            },
        })
            .then((result) => {
                cleanListeners();
                return result;
            })
            .catch((err: any) => {
                // Do not move to finally block. We need to clear it before
                // another fetch attempt is called to not abort it by accident.
                cleanListeners();
                if (isTimeout && attempt < DOWNLOAD_RETRIES_ON_TIMEOUT) {
                    return doFetch(attempt + 1);
                }
                if (err.name === 'AbortError') {
                    throw err;
                }
                throw createOfflineError({});
            });
    };

    const response = await doFetch();

    // Download can be rate limited. Lets wait defined time by server
    // before making another attempt.
    if (response.status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
        return retryHandler({ response } as any, MAX_TOO_MANY_REQUESTS_WAIT).then(() =>
            downloadBlock(abortController, url, token)
        );
    }

    if (!response.body) {
        throw Error(`Response has no data`);
    }

    if (response.status === HTTP_STATUS_CODE.NOT_FOUND) {
        throw createApiError(
            'Block not found',
            response,
            {},
            {
                Code: RESPONSE_CODE.NOT_FOUND,
            }
        );
    }

    return toPolyfillReadable(response.body) as ReadableStream<Uint8Array>;
}
