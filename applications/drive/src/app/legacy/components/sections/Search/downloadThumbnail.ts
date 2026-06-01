import { readToEnd, toStream } from '@openpgp/web-stream-tools';
import { CryptoProxy, type VERIFICATION_STATUS } from '@protontech/crypto';
import type { PrivateKeyReference, SessionKey } from '@protontech/crypto';

import { EnrichedError } from '@proton/drive/legacy/errorHandling';
import { retryHandler } from '@proton/shared/lib/api/helpers/retryHandler';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { DOWNLOAD_RETRIES_ON_TIMEOUT, DOWNLOAD_TIMEOUT, RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { createApiError, createOfflineError } from '@proton/shared/lib/fetch/ApiError';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';

import config from '../../../../config';
import { replaceLocalURL } from '../../../../utils/replaceLocalURL';
import { streamToBuffer } from '../../../../utils/stream';
import { loadCreateReadableStreamWrapper } from '../../../../utils/webStreamsPolyfill';

const MAX_TOO_MANY_REQUESTS_WAIT = 60 * 60; // seconds

type DecryptFileKeys = {
    privateKey: PrivateKeyReference;
    sessionKeys?: SessionKey | SessionKey[];
    addressPublicKeys?: any;
};

type GetKeysCallback = () => Promise<DecryptFileKeys>;
type GetCache = () => Promise<Uint8Array<ArrayBuffer> | undefined>;
type SetCache = (data: Uint8Array<ArrayBuffer>) => void;
type StreamOrCache = ReadableStream<Uint8Array<ArrayBuffer>> | Uint8Array<ArrayBuffer>;

async function downloadBlock(
    abortController: AbortController,
    url: string,
    token: string
): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
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

        return fetch(replaceLocalURL(url), {
            signal: abortController.signal,
            method: 'get',
            credentials: 'omit',
            headers: {
                'pm-storage-token': token,
                ...getAppVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION),
            },
        })
            .then((result) => {
                cleanListeners();
                return result;
            })
            .catch((err: any) => {
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

    if (response.status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
        return retryHandler({ response } as any, MAX_TOO_MANY_REQUESTS_WAIT).then(() =>
            downloadBlock(abortController, url, token)
        );
    }

    if (!response.body) {
        throw Error(`Response has no data`);
    }

    if (response.status === HTTP_STATUS_CODE.NOT_FOUND) {
        throw createApiError('Block not found', response, {}, { Code: RESPONSE_CODE.NOT_FOUND });
    }

    return loadCreateReadableStreamWrapper(response.body);
}

async function decryptThumbnail(
    streamOrCache: StreamOrCache,
    getKeys: GetKeysCallback,
    setCache: SetCache
): Promise<{ data: ReadableStream<Uint8Array<ArrayBuffer>>; verificationStatusPromise: Promise<VERIFICATION_STATUS> }> {
    const { sessionKeys, addressPublicKeys } = await getKeys();

    const binaryMessage =
        streamOrCache instanceof Uint8Array ? streamOrCache : await readToEnd<Uint8Array<ArrayBuffer>>(streamOrCache);
    if (!(streamOrCache instanceof Uint8Array) && binaryMessage instanceof Uint8Array) {
        setCache(binaryMessage);
    }

    const decrypt = async () => {
        try {
            return await CryptoProxy.decryptMessage({
                binaryMessage,
                sessionKeys,
                verificationKeys: addressPublicKeys,
                format: 'binary',
            });
        } catch (e: unknown) {
            if (e instanceof Error) {
                throw new EnrichedError(`Download failed: ${e.message || 'crypto'}`, {
                    extra: { e, crypto: true },
                });
            }
            throw e;
        }
    };

    const { data, verificationStatus } = await decrypt();

    return {
        data: toStream(data) as ReadableStream<Uint8Array<ArrayBuffer>>,
        verificationStatusPromise: Promise.resolve(verificationStatus),
    };
}

export async function downloadThumbnail(
    url: string,
    token: string,
    getKeys: GetKeysCallback,
    getCache: GetCache,
    setCache: SetCache
) {
    const abortController = new AbortController();
    const cache: StreamOrCache | undefined = await getCache();
    const stream = cache ?? (await downloadBlock(abortController, url, token));
    const { data: decryptedStream, verificationStatusPromise } = await decryptThumbnail(stream, getKeys, setCache);

    return {
        abortController,
        contents: streamToBuffer(decryptedStream),
        verificationStatusPromise,
    };
}
