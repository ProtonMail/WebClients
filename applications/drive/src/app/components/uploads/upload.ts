import { traceError } from '@proton/shared/lib/helpers/sentry';

import { TransferCancel } from '../../interfaces/transfer';
import { mimeTypeFromFile } from '../../utils/MimeTypeParser/MimeTypeParser';
import { makeThumbnail } from '../thumbnail/thumbnail';
import { UploadWorkerController } from './workerController';
import { UploadCallbacks, UploadControls, FileRequestBlock, ThumbnailRequestBlock, BlockToken } from './interface';

export function initUpload(
    file: File,
    { initialize, createBlockLinks, onProgress, finalize, onError }: UploadCallbacks
): UploadControls {
    const abortController = new AbortController();
    let isCancelled = false;
    let workerApi: UploadWorkerController;

    // Start detecting mime type right away to have this information once the
    // upload starts so we can generate thumbnail as fast as possible without
    // need to wait for creation of revision on API.
    const mimeTypePromise = mimeTypeFromFile(file);

    const start = async () => {
        // Worker has a slight overhead about 40 ms. Lets start creating
        // revision on API and making thumbnail a bit sooner.
        const setupPromise = mimeTypePromise.then(async (mimeType) => {
            return Promise.all([
                initialize(abortController.signal, mimeType),
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
                    createBlockLinks(fileBlocks, thumbnailBlock)
                        .then(({ fileLinks, thumbnailLink }) => workerApi.postCreatedBlocks(fileLinks, thumbnailLink))
                        .catch(reject);
                },
                onProgress: (increment: number) => {
                    onProgress?.(increment);
                },
                finalize: (blockTokens: BlockToken[], signature: string, signatureAddress: string) => {
                    finalize(blockTokens, signature, signatureAddress).then(resolve).catch(reject);
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
        isCancelled = true;
        abortController.abort();
        workerApi?.cancel();
    };

    return {
        start: () =>
            start()
                .catch((err) => {
                    abortController.abort();
                    onError?.(err);
                    if (!isCancelled) {
                        throw err;
                    }
                })
                .finally(() => {
                    workerApi?.terminate();
                }),
        cancel,
        pause,
        resume,
    };
}
