import { ReadableStream } from 'web-streams-polyfill';

import { createApiError, createOfflineError } from '@proton/shared/lib/fetch/ApiError';
import { DOWNLOAD_TIMEOUT, DOWNLOAD_RETRIES_ON_TIMEOUT, RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { createReadableStreamWrapper } from '@mattiasbuelens/web-streams-adapter';

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
        abortController.signal.addEventListener('abort', () => {
            timeoutController.abort();
            clearTimeout(timeoutHandle);
        });

        return fetch(url, {
            signal: abortController.signal,
            method: 'get',
            credentials: 'omit',
            headers: {
                'pm-storage-token': token,
            },
        })
            .then((result) => {
                clearTimeout(timeoutHandle);
                return result;
            })
            .catch((err: any) => {
                // Do not move to finally block. We need to clear it before
                // another fetch attempt is called to not abort it by accident.
                clearTimeout(timeoutHandle);
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
