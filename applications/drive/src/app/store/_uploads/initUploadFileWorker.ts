import { traceError } from '@proton/shared/lib/helpers/sentry';

import { TransferCancel } from '../../components/TransferManager/transfer';
import type {
    FileKeys,
    FileRequestBlock,
    Photo,
    ThumbnailRequestBlock,
    UploadCallbacks,
    UploadFileControls,
    UploadFileProgressCallbacks,
} from './interface';
import { mimeTypeFromFile } from './mimeTypeParser/mimeTypeParser';
import { getThumbnailsData } from './thumbnail';
import { UploadWorkerController } from './workerController';

export function initUploadFileWorker(
    file: File,
    isPhoto: boolean,
    { initialize, createFileRevision, createBlockLinks, getVerificationData, finalize, onError }: UploadCallbacks
): UploadFileControls {
    const abortController = new AbortController();
    let workerApi: UploadWorkerController;

    // Start detecting mime type right away to have this information once the
    // upload starts, so we can generate thumbnail as fast as possible without
    // need to wait for creation of revision on API.
    const mimeTypePromise = mimeTypeFromFile(file);

    const start = async ({ onInit, onProgress, onNetworkError, onFinalize }: UploadFileProgressCallbacks = {}) => {
        // Worker has a slight overhead about 40 ms. Let's start generating
        // thumbnail a bit sooner.
        const thumbnailsDataPromise = getThumbnailsData(mimeTypePromise, file, isPhoto);

        return new Promise<void>((resolve, reject) => {
            const worker = new Worker(
                new URL(
                    /* webpackChunkName: "drive-worker" */
                    './worker/worker.ts',
                    import.meta.url
                )
            );
            workerApi = new UploadWorkerController(worker, {
                keysGenerated: (keys: FileKeys) => {
                    mimeTypePromise
                        .then(async (mimeType) => {
                            return createFileRevision(abortController.signal, mimeType, keys).then(
                                async (fileRevision) => {
                                    onInit?.(mimeType, fileRevision.fileName);

                                    return Promise.all([
                                        thumbnailsDataPromise,
                                        getVerificationData(abortController.signal),
                                    ]).then(async ([thumbnailData, verificationData]) => {
                                        await workerApi.postStart(
                                            file,
                                            mimeType,
                                            isPhoto,
                                            thumbnailData,
                                            fileRevision.address.privateKey,
                                            fileRevision.address.email,
                                            fileRevision.privateKey,
                                            fileRevision.sessionKey,
                                            fileRevision.parentHashKey,
                                            verificationData
                                        );
                                    });
                                }
                            );
                        })
                        .catch(reject);
                },
                createBlocks: (fileBlocks: FileRequestBlock[], thumbnailBlocks?: ThumbnailRequestBlock[]) => {
                    createBlockLinks(abortController.signal, fileBlocks, thumbnailBlocks)
                        .then(({ fileLinks, thumbnailLinks }) => workerApi.postCreatedBlocks(fileLinks, thumbnailLinks))
                        .catch(reject);
                },
                onProgress: (increment: number) => {
                    onProgress?.(increment);
                },
                finalize: (signature: string, signatureAddress: string, xattr: string, photo?: Photo) => {
                    onFinalize?.();
                    finalize(signature, signatureAddress, xattr, photo).then(resolve).catch(reject);
                },
                onNetworkError: (error: string) => {
                    onNetworkError?.(error);
                },
                onError: (error: string) => {
                    reject(new Error(error));
                },
                notifySentry: (error: Error) => {
                    traceError(error);
                },
                onCancel: () => {
                    reject(new TransferCancel({ message: `Transfer canceled for ${file.name}` }));
                },
            });

            initialize(abortController.signal)
                .then(async ({ addressPrivateKey, parentPrivateKey }) => {
                    await workerApi.postGenerateKeys(addressPrivateKey, parentPrivateKey);
                })
                .catch(reject);
        });
    };

    const pause = async () => {
        workerApi?.postPause();
    };

    const resume = async () => {
        workerApi?.postResume();
    };

    const cancel = async () => {
        abortController.abort();
        workerApi?.cancel();
    };

    return {
        start: (progressCallbacks?: UploadFileProgressCallbacks) =>
            start(progressCallbacks)
                .catch((err) => {
                    abortController.abort();
                    onError?.(err);
                    throw err;
                })
                .finally(() => {
                    workerApi?.postClose();
                    // We give some time to the worker to `close()` itself, to safely erase the stored private keys.
                    // We still forcefully terminate it after a few seconds, in case the worker is unexpectedly stuck
                    // in a bad state, hence couldn't close itself.
                    setTimeout(() => {
                        workerApi?.terminate();
                    }, 5000);
                }),
        cancel,
        pause,
        resume,
    };
}
