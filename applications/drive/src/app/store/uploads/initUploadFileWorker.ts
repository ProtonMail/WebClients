import { traceError } from '@proton/shared/lib/helpers/sentry';
import { TransferCancel } from '@proton/shared/lib/interfaces/drive//transfer';

import { mimeTypeFromFile } from './mimeTypeParser/mimeTypeParser';
import { makeThumbnail } from './thumbnail';
import { UploadWorkerController } from './workerController';
import {
    UploadCallbacks,
    UploadFileControls,
    UploadFileProgressCallbacks,
    FileRequestBlock,
    ThumbnailRequestBlock,
    BlockToken,
} from './interface';

export function initUploadFileWorker(
    file: File,
    { initialize, createBlockLinks, finalize, onError }: UploadCallbacks
): UploadFileControls {
    const abortController = new AbortController();
    let workerApi: UploadWorkerController;

    // Start detecting mime type right away to have this information once the
    // upload starts so we can generate thumbnail as fast as possible without
    // need to wait for creation of revision on API.
    const mimeTypePromise = mimeTypeFromFile(file);

    const start = async ({ onInit, onProgress, onNetworkError, onFinalize }: UploadFileProgressCallbacks = {}) => {
        // Worker has a slight overhead about 40 ms. Lets start creating
        // revision on API and making thumbnail a bit sooner.
        const setupPromise = mimeTypePromise.then(async (mimeType) => {
            return Promise.all([
                initialize(abortController.signal, mimeType).then((fileRevision) => {
                    onInit?.(mimeType, fileRevision.fileName);
                    return fileRevision;
                }),
                makeThumbnail(mimeType, file).catch((err) => {
                    traceError(err);
                    return undefined;
                }),
            ]);
        });

        return new Promise<void>((resolve, reject) => {
            const worker = new Worker(new URL('./worker/worker.ts', import.meta.url));
            workerApi = new UploadWorkerController(worker, {
                createBlocks: (fileBlocks: FileRequestBlock[], thumbnailBlock?: ThumbnailRequestBlock) => {
                    createBlockLinks(abortController.signal, fileBlocks, thumbnailBlock)
                        .then(({ fileLinks, thumbnailLink }) => workerApi.postCreatedBlocks(fileLinks, thumbnailLink))
                        .catch(reject);
                },
                onProgress: (increment: number) => {
                    onProgress?.(increment);
                },
                finalize: (blockTokens: BlockToken[], signature: string, signatureAddress: string) => {
                    onFinalize?.();
                    finalize(blockTokens, signature, signatureAddress).then(resolve).catch(reject);
                },
                onNetworkError: (error: string) => {
                    onNetworkError?.(error);
                },
                onError: (error: string) => {
                    reject(new Error(error));
                },
                onCancel: () => {
                    reject(new TransferCancel({ message: `Transfer canceled for ${file.name}` }));
                },
            });

            setupPromise
                .then(([fileRevision, thumbnailData]) => {
                    workerApi.postStart(
                        file,
                        thumbnailData,
                        fileRevision.address.privateKey,
                        fileRevision.address.email,
                        fileRevision.privateKey,
                        fileRevision.sessionKey
                    );
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
                    workerApi?.terminate();
                }),
        cancel,
        pause,
        resume,
    };
}
