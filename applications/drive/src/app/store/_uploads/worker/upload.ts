import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { retryHandler } from '@proton/shared/lib/api/helpers/retryHandler';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';
import { serializeFormData } from '@proton/shared/lib/fetch/serialize';

import { MAX_RETRIES_BEFORE_FAIL, MAX_TOO_MANY_REQUESTS_WAIT, MAX_UPLOAD_JOBS } from '../constants';
import type { UploadingBlockControl } from './interface';
import type { Pauser } from './pauser';
import { uploadWorker } from './worker';

type LogCallback = (message: string) => void;

/**
 * startUploadJobs starts MAX_UPLOAD_JOBS jobs to read uploading blocks
 * and upload the date to the backend.
 */
export default async function startUploadJobs(
    pauser: Pauser,
    generator: AsyncGenerator<UploadingBlockControl>,
    progressCallback: (progress: number) => void,
    networkErrorCallback: (error: Error) => void,
    log: LogCallback,
    uploadBlockDataCallback = uploadBlockData
) {
    const promises: Promise<void>[] = [];
    for (let idx = 0; idx < MAX_UPLOAD_JOBS; idx++) {
        promises.push(
            startUploadJob(pauser, generator, progressCallback, networkErrorCallback, log, uploadBlockDataCallback)
        );
    }
    return Promise.all(promises);
}

async function startUploadJob(
    pauser: Pauser,
    generator: AsyncGenerator<UploadingBlockControl>,
    progressCallback: (progress: number) => void,
    networkErrorCallback: (error: Error) => void,
    log: LogCallback,
    uploadBlockDataCallback = uploadBlockData
) {
    // Ideally here would be this line:
    //   for await (const block of generator)
    // But there is an issue at least in Chrome 108 that rejection from a for loop
    // is not propagated above and then upload is stuck forever.
    while (true) {
        const { done, value: block } = await generator.next();
        if (done) {
            break;
        }
        await pauser.waitIfPaused();
        await uploadBlock(
            block,
            pauser,
            progressCallback,
            networkErrorCallback,
            (message: string) => log(`upload block ${block.index}: ${message}`),
            uploadBlockDataCallback
        ).catch((e) => {
            log(`upload block ${block.index} failed: ${e}`);
            throw e;
        });
    }
}

async function uploadBlock(
    block: UploadingBlockControl,
    pauser: Pauser,
    progressCallback: (progress: number) => void,
    networkErrorCallback: (error: Error) => void,
    log: LogCallback,
    uploadBlockDataCallback = uploadBlockData,
    numRetries = 0
): Promise<void> {
    // It could take some time from block token creation and block upload
    // itself: for example, the process could be paused (either this block
    // or any other) for too long. If we know it is old token, we can
    // optimise and ask for new one right away without even uploading data.
    if (block.isTokenExpired()) {
        block.onTokenExpiration();
        return;
    }

    let progress = 0;
    const onProgress = (relativeIncrement: number) => {
        const increment = block.originalSize * relativeIncrement;
        if (increment !== 0) {
            progress += increment;
            progressCallback(increment);
        }
    };
    const resetProgress = () => {
        if (progress !== 0) {
            progressCallback(-progress);
        }
        progress = 0;
    };

    try {
        log('Requesting upload');
        await uploadBlockDataCallback(
            block.uploadLink,
            block.uploadToken,
            block.encryptedData,
            onProgress,
            pauser.abortController.signal
        );
        log('Finished upload');
        block.finish();
    } catch (err: any | XHRError) {
        resetProgress();

        if (pauser.isPaused) {
            log('Paused upload, waiting');
            await pauser.waitIfPaused();
            log('Upload resumed');
            return uploadBlock(block, pauser, progressCallback, networkErrorCallback, log, uploadBlockDataCallback, 0);
        }

        // Upload can be rate limited. Lets wait defined time by server
        // before making another attempt.
        if (err.statusCode === HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
            log('Too many requests, waiting');
            return retryHandler(err, MAX_TOO_MANY_REQUESTS_WAIT).then(() =>
                uploadBlock(
                    block,
                    pauser,
                    progressCallback,
                    networkErrorCallback,
                    log,
                    uploadBlockDataCallback,
                    numRetries
                )
            );
        }

        // Upload can be cancelled at the moment when the block is already
        // committed on the backend side, but from the client point of view
        // the request was cancelled. When we attempt to upload again, we
        // were getting this error. But there were cases when the block was
        // not properly stored, so backend rather dropped this feature and
        // requires always to have successfull upload to not miss anything.
        // It could not be here at all, but just in case, the best is to ask
        // for new token (because old one wouldn't be possible to use) and
        // try upload again.
        // If its 2023, it's super safe to remove.
        if (err.errorCode === RESPONSE_CODE.ALREADY_EXISTS) {
            log('Block token exists. Asking for new upload token.');
            console.warn(`Block token #${block.index} already exists. Asking for new upload token.`);
            block.onTokenExpiration();
            return;
        }

        // We detect token expiration on client side before calling API so
        // this should not happen except few edge cases, such as different
        // time configuration on server and client, or there might be tiny
        // window because of different start of expiration measurmement.
        // Anyway, we can simply ask for new tokens here as well.
        if (err.errorCode === RESPONSE_CODE.NOT_FOUND || err.statusCode === HTTP_STATUS_CODE.NOT_FOUND) {
            log('Expired block token. Asking for new upload token.');
            console.warn(`Expired block token #${block.index}. Asking for new upload token.`);
            block.onTokenExpiration();
            return;
        }

        // If we experience some slight issue on server side, lets try
        // one more time before notyfing user in transfer manager.
        // Be careful about too many attempts as that could be harmful
        // for our servers - if we have traffic issue, retrying too
        // many times could lead to longer downtime.
        if (numRetries === 0 && getIsConnectionIssue(err)) {
            log(`Connection issue, automatic retry: ${err}`);
            console.warn(`Connection issue for block #${block.index} upload. Retrying one more time.`);
            return uploadBlock(
                block,
                pauser,
                progressCallback,
                networkErrorCallback,
                log,
                uploadBlockDataCallback,
                numRetries + 1
            );
        }

        if (networkErrorCallback && getIsConnectionIssue(err)) {
            log(`Connection issue, waiting for network: ${err}`);
            pauser.pause();
            networkErrorCallback(err);
            await pauser.waitIfPaused();
            log(`Resuming upload`);
            return uploadBlock(block, pauser, progressCallback, networkErrorCallback, log, uploadBlockDataCallback, 0);
        }

        if (numRetries < MAX_RETRIES_BEFORE_FAIL) {
            log(`Failed block upload (retry num: ${numRetries}, error: ${err})`);
            console.warn(`Failed block #${block.index} upload. Retry num: ${numRetries}`);
            return uploadBlock(
                block,
                pauser,
                progressCallback,
                networkErrorCallback,
                log,
                uploadBlockDataCallback,
                numRetries + 1
            );
        }

        throw err;
    }
}

async function uploadBlockData(
    url: string,
    token: string,
    content: Uint8Array<ArrayBuffer>,
    onProgress: (relativeIncrement: number) => void,
    signal: AbortSignal
) {
    let listener: () => void;

    return new Promise<void>((resolve, reject) => {
        if (signal.aborted) {
            reject(new Error('Upload aborted'));
            return;
        }

        const xhr = new XMLHttpRequest();

        let lastLoaded = 0;
        let total = 0;
        xhr.upload.onprogress = (e) => {
            total = e.total;
            onProgress((e.loaded - lastLoaded) / total);
            lastLoaded = e.loaded;
        };

        listener = () => {
            // When whole block is uploaded, we mustn't cancel even if we don't get a response
            if (!total || lastLoaded !== total) {
                xhr.abort();
                reject(new Error('Upload aborted'));
            }
        };
        signal.addEventListener('abort', listener);

        xhr.onload = async () => {
            if (xhr.status >= HTTP_STATUS_CODE.OK && xhr.status < HTTP_STATUS_CODE.BAD_REQUEST) {
                resolve();
            } else {
                reject(
                    new XHRError(xhr.response?.Error || xhr.statusText, xhr.response?.Code, xhr.status, xhr.response)
                );
            }
        };

        xhr.responseType = 'json';
        xhr.upload.onerror = () => {
            // onerror provides ProgressEvent, not any error.
            // It can happen when internet is down, for example.
            reject(new Error('network error'));
        };
        xhr.onerror = () => {
            // onerror provides ProgressEvent, not any error.
            // It can happen when browser blocks the request, for example.
            reject(new Error('Upload failed'));
        };

        const onTimeout = () => {
            // ontimeout can happen during switching proxy, for example.
            reject(new Error('Upload timed out'));
        };

        xhr.upload.ontimeout = onTimeout;
        xhr.ontimeout = onTimeout;

        xhr.open('POST', url);
        xhr.setRequestHeader('pm-storage-token', token);
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, max-age=0');

        // the default values are for type safety, it should never occur, if it does, we have a problem
        const appVersionHeaders = getAppVersionHeaders(
            getClientID(uploadWorker.config?.APP_NAME || 'proton-drive'),
            uploadWorker.config?.APP_VERSION || '0.0.0+wrong123'
        );
        Object.keys(appVersionHeaders).forEach((header) => {
            xhr.setRequestHeader(header, appVersionHeaders[header as keyof typeof appVersionHeaders]);
        });
        xhr.send(
            serializeFormData({
                Block: new Blob([content]),
            })
        );
    }).finally(() => {
        if (listener) {
            signal.removeEventListener('abort', listener);
        }
    });
}

export class XHRError extends Error {
    errorCode: number; // API error code.

    statusCode: number; // XHR status code.

    response?: Response;

    constructor(message: string, code: number, status: number, response?: Response) {
        super(message);
        this.errorCode = code;
        this.statusCode = status;
        this.response = response;
    }
}
