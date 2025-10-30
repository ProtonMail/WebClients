import { ThumbnailType } from '@proton/drive';
import { type ThumbnailResult, generateThumbnail } from '@proton/drive/modules/thumbnails';
import { getItem } from '@proton/shared/lib/helpers/storage';

import { TransferCancel } from '../../components/TransferManager/transfer';
import config from '../../config';
import { sendErrorReport } from '../../utils/errorHandling';
import { unleashVanillaStore } from '../../zustand/unleash/unleash.store';
import type {
    FileKeys,
    FileRequestBlock,
    OnFileUploadSuccessCallbackData,
    PhotoUpload,
    ThumbnailRequestBlock,
    UploadCallbacks,
    UploadFileControls,
    UploadFileProgressCallbacks,
} from './interface';
import { ThumbnailType as LegacyThumbnailType, getMediaInfo } from './media';
import { mimeTypeFromFile } from './mimeTypeParser/mimeTypeParser';
import { UploadWorkerController } from './workerController';

type LogCallback = (message: string) => void;

/**
 * TODO: Remove this once we fully migrate to the new thumbnail generation.
 */
function mapNewThumbnailTypeToLegacy(newType: ThumbnailType): LegacyThumbnailType {
    if (newType === ThumbnailType.Type1) {
        return LegacyThumbnailType.PREVIEW;
    }
    if (newType === ThumbnailType.Type2) {
        return LegacyThumbnailType.HD_PREVIEW;
    }
    return LegacyThumbnailType.PREVIEW;
}

class TransferRetry extends Error {
    constructor(options: { message: string }) {
        super(options.message);
        this.name = 'TransferRetry';
    }
}

export function initUploadFileWorker(
    file: File,
    isForPhotos: boolean,
    {
        initialize,
        createFileRevision,
        createBlockLinks,
        getVerificationData,
        finalize,
        onError,
        notifyVerificationError,
    }: UploadCallbacks,
    log: LogCallback
): UploadFileControls {
    const abortController = new AbortController();
    let workerApi: UploadWorkerController;

    const useNewThumbnailGeneration = unleashVanillaStore.getState().isEnabled('DriveWebNewThumbnailGeneration');

    // Start detecting mime type right away to have this information once the
    // upload starts, so we can generate thumbnail as fast as possible without
    // need to wait for creation of revision on API.
    let mimeTypePromise: Promise<string>;
    let thumbnailsPromise: Promise<{ ok: true; result: ThumbnailResult } | { ok: false; error: unknown }> | undefined;

    if (useNewThumbnailGeneration) {
        const thumbnailGeneration = generateThumbnail(file, file.name, file.size, {
            debug: Boolean(getItem('proton-drive-debug', 'false')),
        });
        mimeTypePromise = thumbnailGeneration.mimeTypePromise;
        thumbnailsPromise = thumbnailGeneration.thumbnailsPromise;
    } else {
        mimeTypePromise = mimeTypeFromFile(file);
    }

    const startUpload = async ({
        onInit,
        onProgress,
        onNetworkError,
        onFinalize,
    }: UploadFileProgressCallbacks = {}) => {
        // Worker has a slight overhead about 40 ms. Let's start generating
        // thumbnail a bit sooner.
        const mediaInfoPromise =
            useNewThumbnailGeneration && thumbnailsPromise
                ? (async () => {
                      const thumbnailResult = await thumbnailsPromise;

                      if (!thumbnailResult.ok || !thumbnailResult.result) {
                          return undefined;
                      }
                      const legacyThumbnails = thumbnailResult.result.thumbnails?.map((thumbnail) => {
                          return {
                              thumbnailData: thumbnail.thumbnailData,
                              thumbnailType: mapNewThumbnailTypeToLegacy(thumbnail.thumbnailType),
                          };
                      });
                      return {
                          width: thumbnailResult.result.width,
                          height: thumbnailResult.result.height,
                          duration: thumbnailResult.result.duration,
                          thumbnails: legacyThumbnails,
                      };
                  })()
                : getMediaInfo(mimeTypePromise, file);

        return new Promise<OnFileUploadSuccessCallbackData>((resolve, reject) => {
            const worker = new Worker(
                /* webpackChunkName: "drive-worker" */
                /* webpackPrefetch: true */
                /* webpackPreload: true */
                new URL('./worker/worker.ts', import.meta.url)
            );

            worker.postMessage({ command: 'config', data: config });

            workerApi = new UploadWorkerController(worker, log, {
                keysGenerated: (keys: FileKeys) => {
                    mimeTypePromise
                        .then(async (mimeType) => {
                            return createFileRevision(abortController.signal, mimeType, keys).then(
                                async (fileRevision) => {
                                    onInit?.(mimeType, fileRevision.fileName);

                                    return Promise.all([
                                        mediaInfoPromise,
                                        getVerificationData(abortController.signal),
                                    ]).then(async ([mediaInfo, verificationData]) => {
                                        await workerApi.postStart(
                                            file,
                                            {
                                                mimeType,
                                                isForPhotos,
                                                media: {
                                                    width: mediaInfo?.width,
                                                    height: mediaInfo?.height,
                                                    duration: mediaInfo?.duration,
                                                },
                                                thumbnails: mediaInfo?.thumbnails,
                                            },
                                            fileRevision.address?.privateKey,
                                            fileRevision.address?.email || '',
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
                finalize: (signature: string, signatureEmail: string, xattr: string, photo?: PhotoUpload) => {
                    onFinalize?.();
                    finalize(signature, signatureEmail, xattr, photo)
                        .then((file) => {
                            resolve(file);
                        })
                        .catch(reject);
                },
                onNetworkError: (error: Error) => {
                    onNetworkError?.(error);
                },
                onError: (error: Error) => {
                    reject(error);
                },
                notifySentry: (error: Error) => {
                    sendErrorReport(error);
                },
                notifyVerificationError: (retryHelped: boolean) => {
                    notifyVerificationError(retryHelped);
                },
                onCancel: () => {
                    reject(new TransferCancel({ message: `Transfer canceled for ${file.name}` }));
                },
                onHeartbeatTimeout: () => {
                    reject(new TransferRetry({ message: `Heartbeat timeout` }));
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
            startUpload(progressCallbacks)
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
