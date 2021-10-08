import { generateUID } from '@proton/components';
import { orderBy, areUint8Arrays } from '@proton/shared/lib/helpers/array';
import { ReadableStream } from 'web-streams-polyfill';
import { createReadableStreamWrapper } from '@mattiasbuelens/web-streams-adapter';
import { Api } from '@proton/shared/lib/interfaces';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { getIsUnreachableError, getIsOfflineError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { noop } from '@proton/shared/lib/helpers/function';
import { DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';
import { queryFileBlock } from '@proton/shared/lib/api/drive/files';
import { API, TransferCancel } from '@proton/shared/lib/interfaces/drive/transfer';
import {
    MAX_THREADS_PER_DOWNLOAD,
    DOWNLOAD_TIMEOUT,
    STATUS_CODE,
    DOWNLOAD_RETRIES_ON_TIMEOUT,
    BATCH_REQUEST_SIZE,
} from '@proton/shared/lib/drive/constants';

import { ObserverStream, streamToBuffer, untilStreamEnd } from '../../utils/stream';
import { waitUntil } from '../../utils/async';
import { isTransferCancelError } from '../../utils/transfer';
import { MAX_RETRIES_BEFORE_FAIL, MAX_TOTAL_BUFFER_SIZE, TIME_TO_RESET_RETRIES } from './constants';

const toPolyfillReadable = createReadableStreamWrapper(ReadableStream);

export type StreamTransformer = (
    stream: ReadableStream<Uint8Array>,
    EncSignature: string
) => Promise<ReadableStream<Uint8Array>>;

export interface DownloadControls {
    start: (api: API) => Promise<void>;
    cancel: () => void;
    pause: () => Promise<void>;
    resume: () => void;
}

export interface DownloadCallbacks {
    getBlocks: (
        abortSignal: AbortSignal,
        pagination?: {
            FromBlockIndex: number;
            PageSize: number;
        }
    ) => Promise<DriveFileBlock[] | Uint8Array[]>;
    onStart?: (stream: ReadableStream<Uint8Array>) => void;
    onProgress?: (bytes: number) => void;
    onFinish?: () => void;
    onError?: (err: any) => void;
    onNetworkError?: (id: string, err: any) => void;
    transformBlockStream?: StreamTransformer;
}

/**
 * initDownload prepares download transfer for the DownloadProvider queue.
 * Download is not started right away, it has to be started explicitly by
 * DownloadProvider.
 * How the download itself starts, see start function inside.
 */
export const initDownload = ({
    getBlocks,
    onStart,
    onProgress,
    onFinish,
    onError,
    onNetworkError,
    transformBlockStream,
}: DownloadCallbacks) => {
    const id = generateUID('drive-transfers');
    const fileStream = new ObserverStream();
    const fsWriter = fileStream.writable.getWriter();

    const incompleteProgress = new Map<number, number>();
    let abortController = new AbortController();
    let paused = false;

    // start fetches blocks of the file and downloads those blocks in parallel.
    // Note its not real parallelism. This runs in main thread but that's fine
    // as the main job is to do requests to the API. Decryption (executed in
    // transformBlockStream) is passed to web workers, currently created by
    // openpgpjs library. The data exchanges are a bit of downside, therefore
    // we want create web workers manually  in the future that will do download
    // and decryption together. See MAX_THREADS_PER_DOWNLOAD for more info.
    const start = async (api: Api) => {
        if (abortController.signal.aborted) {
            throw new TransferCancel({ id });
        }

        const buffers = new Map<number, { done: boolean; chunks: Uint8Array[] }>();
        let blocksOrBuffer: DriveFileBlock[] | Uint8Array[] = [];
        let fromBlockIndex = 1;

        const hasMorePages = (currentPageLength: number) => currentPageLength === BATCH_REQUEST_SIZE;

        const getBlocksPaged = async (pagination: { FromBlockIndex: number; PageSize: number }) => {
            try {
                blocksOrBuffer = await getBlocks(abortController.signal, pagination);
            } catch (err: any) {
                // If paused before blocks/meta is fetched (DOM Error), restart on resume pause
                if (paused && isTransferCancelError(err)) {
                    await waitUntil(() => paused === false);
                    await start(api);
                    return false;
                }
                throw err;
            }

            return true;
        };

        // Downloads initial page
        if (!(await getBlocksPaged({ FromBlockIndex: fromBlockIndex, PageSize: BATCH_REQUEST_SIZE }))) {
            return false;
        }

        await fsWriter.ready;
        onStart?.(fileStream.readable);

        const preloadBuffer = async () => {
            for (const buffer of blocksOrBuffer) {
                await fsWriter.write(buffer as Uint8Array);
            }

            while (hasMorePages(blocksOrBuffer.length)) {
                fromBlockIndex += BATCH_REQUEST_SIZE;

                if (await getBlocksPaged({ FromBlockIndex: fromBlockIndex, PageSize: BATCH_REQUEST_SIZE })) {
                    for (const buffer of blocksOrBuffer) {
                        await fsWriter.write(buffer as Uint8Array);
                    }
                } else {
                    return;
                }
            }

            await fsWriter.ready;
            await fsWriter.close();
        };

        // If initialized with preloaded buffer instead of blocks to download
        if (areUint8Arrays(blocksOrBuffer)) {
            await preloadBuffer();
            return;
        }

        let blocks = blocksOrBuffer as DriveFileBlock[];
        let activeIndex = 1;

        const flushBuffer = async (Index: number) => {
            const currentBuffer = buffers.get(Index);
            if (currentBuffer?.chunks.length) {
                for (const chunk of currentBuffer.chunks) {
                    await fsWriter.ready;
                    await fsWriter.write(chunk);
                }
                buffers.delete(Index);
            }
        };

        const revertProgress = () => {
            if (onProgress) {
                // Revert progress of blacks that weren't finished
                buffers.forEach((buffer, Index) => {
                    if (!buffer.done) {
                        buffers.delete(Index);
                    }
                });

                let progressToRevert = 0;
                incompleteProgress.forEach((progress) => {
                    progressToRevert += progress;
                });
                incompleteProgress.clear();
                onProgress(-progressToRevert);
            }
        };

        const getBlockQueue = (startIndex = 1) => orderBy(blocks, 'Index').filter(({ Index }) => Index >= startIndex);

        let lastConsecutiveRetryTs = 0;
        // Downloads several blocks at once, but streams sequentially only one block at a time
        // Other blocks are put into buffer until previous blocks have finished downloading
        const startDownload = async (blockQueue: DriveFileBlock[], numRetries = 0) => {
            if (!blockQueue.length) {
                return [];
            }
            activeIndex = blockQueue[0].Index;

            const retryDownload = async (activeIndex: number) => {
                const newBlocks = await getBlocks(abortController.signal, {
                    FromBlockIndex: fromBlockIndex,
                    PageSize: BATCH_REQUEST_SIZE,
                });
                if (areUint8Arrays(newBlocks)) {
                    throw new Error('Unexpected Uint8Array block data');
                }
                revertProgress();
                abortController = new AbortController();
                blocksOrBuffer = newBlocks;
                blocks = newBlocks;

                let retryCount = 1;
                /*
                 * If download speed is too low, it might require several retries to cover
                 * the whole block page (an amount of attempts greater than the value of
                 * MAX_RETRIES_BEFORE_FAIL). For these cases retry count gets in considertaion
                 * only within a certain timeframe defined by TIME_TO_RESET_RETRIES
                 */
                if (Date.now() - lastConsecutiveRetryTs < TIME_TO_RESET_RETRIES) {
                    retryCount = numRetries + 1;
                }

                lastConsecutiveRetryTs = Date.now();
                await startDownload(getBlockQueue(activeIndex), retryCount);
            };

            let ongoingNumberOfDownloads = 0;
            const downloadQueue = blockQueue.map(({ Index, EncSignature, BareURL, Token }) => async () => {
                ongoingNumberOfDownloads++;
                try {
                    if (!buffers.get(Index)?.done) {
                        await waitUntil(() => buffers.size < MAX_TOTAL_BUFFER_SIZE || abortController.signal.aborted);

                        if (abortController.signal.aborted) {
                            throw new TransferCancel({ id });
                        }

                        const blockStream = toPolyfillReadable(
                            await api({
                                ...queryFileBlock(BareURL),
                                timeout: DOWNLOAD_TIMEOUT,
                                retriesOnTimeout: DOWNLOAD_RETRIES_ON_TIMEOUT,
                                signal: abortController.signal,
                                silence: true,
                                headers: {
                                    'pm-storage-token': Token,
                                },
                            })
                        ) as ReadableStream<Uint8Array>;

                        const progressStream = new ObserverStream((value) => {
                            if (abortController.signal.aborted) {
                                throw new TransferCancel({ id });
                            }
                            incompleteProgress.set(Index, (incompleteProgress.get(Index) ?? 0) + value.length);
                            onProgress?.(value.length);
                        });
                        const rawContentStream = blockStream.pipeThrough(progressStream);

                        // Decrypt the file block content using streaming decryption
                        // TODO: make EncSignature type of string, when downloadShared payload will contain encSignature
                        const transformedContentStream = transformBlockStream
                            ? await transformBlockStream(rawContentStream, EncSignature || '')
                            : rawContentStream;

                        await untilStreamEnd(transformedContentStream, async (data) => {
                            if (abortController.signal.aborted) {
                                throw new TransferCancel({ id });
                            }
                            const buffer = buffers.get(Index);
                            if (buffer) {
                                buffer.chunks.push(data);
                            } else {
                                buffers.set(Index, { done: false, chunks: [data] });
                            }
                        });

                        const currentBuffer = buffers.get(Index);

                        if (currentBuffer) {
                            currentBuffer.done = true;
                        }
                    }

                    if (Index === activeIndex) {
                        let nextIndex = activeIndex;
                        // Flush buffers for subsequent complete blocks too
                        while (buffers.get(nextIndex)?.done) {
                            incompleteProgress.delete(nextIndex);
                            await flushBuffer(nextIndex);
                            nextIndex++;
                        }
                        // Assign next incomplete block as new active block
                        activeIndex = nextIndex;
                    }
                } finally {
                    ongoingNumberOfDownloads--;
                }
            });

            try {
                await runInQueue(downloadQueue, MAX_THREADS_PER_DOWNLOAD);
            } catch (e: any) {
                if (!paused) {
                    abortController.abort();
                    /*
                     * If a block gets expired, backend returns 404. In this case
                     * we need to request new blocks and restart the download
                     * from the active index
                     */
                    if (e.status === STATUS_CODE.NOT_FOUND && numRetries < MAX_RETRIES_BEFORE_FAIL) {
                        console.error(`Blocks for download ${id}, might have expired. Retry num: ${numRetries}`);
                        return retryDownload(activeIndex);
                    }

                    if (onNetworkError && (getIsUnreachableError(e) || getIsOfflineError(e))) {
                        revertProgress();

                        // onNetworkError sets the state of the transfer and
                        // the transfer can be resumed right away--therefore,
                        // pausing has to be done first to avoid race (resuming
                        // sooner than pausing).
                        paused = true;
                        onNetworkError(id, e);

                        // Transfer can be resumed faster than ongoing block
                        // downloads are aborted. Therefore, first we need to
                        // wait for all downloads to be done to avoid flushing
                        // the same buffer more than once.
                        await waitUntil(() => paused === false && ongoingNumberOfDownloads === 0);
                        await startDownload(getBlockQueue(activeIndex));
                        return;
                    }

                    fsWriter.abort(e).catch(console.error);
                    throw e;
                }

                revertProgress();
                await waitUntil(() => paused === false && ongoingNumberOfDownloads === 0);
                await startDownload(getBlockQueue(activeIndex));
            }
        };

        const downloadTheRestOfBlocks = async () => {
            while (hasMorePages(blocksOrBuffer.length)) {
                fromBlockIndex += BATCH_REQUEST_SIZE;

                if (await getBlocksPaged({ FromBlockIndex: fromBlockIndex, PageSize: BATCH_REQUEST_SIZE })) {
                    blocks = blocksOrBuffer as DriveFileBlock[];
                    activeIndex = 1;
                    await startDownload(getBlockQueue());
                } else {
                    return false;
                }
            }

            return true;
        };

        await startDownload(getBlockQueue());
        if (!(await downloadTheRestOfBlocks())) {
            return;
        }

        // Wait for stream to be flushed
        await fsWriter.ready;
        await fsWriter.close();
    };

    const cancel = () => {
        paused = false;
        abortController.abort();
        const error = new TransferCancel({ id });
        fsWriter.abort(error).catch(console.error);
        onError?.(error);
    };

    const pause = async () => {
        paused = true;
        abortController.abort();

        // Wait for download to reset progress or be flushed
        await waitUntil(() => !incompleteProgress.size);
    };

    const resume = () => {
        abortController = new AbortController();
        paused = false;
    };

    const downloadControls: DownloadControls = {
        start: (api) =>
            start(api)
                .then(() => {
                    onFinish?.();
                })
                .catch((err) => {
                    onError?.(err);
                    throw err;
                }),
        cancel,
        pause,
        resume,
    };

    return { id, downloadControls };
};

/**
 * Use startDownload to initialize and start a file download
 * without tracking or necessarily controlling its progress.
 *
 * This function can be utilized when a file need to be downloaded without
 * being added to Transfer Manager. Such use-cases might be thumbnail
 * downloads or showing file previews.
 */
export const startDownload = (
    api: API,
    { getBlocks, transformBlockStream }: Pick<DownloadCallbacks, 'getBlocks' | 'transformBlockStream'>
) => {
    let resolve: (value: Promise<Uint8Array[]>) => void = noop;
    let reject: (reason?: any) => any = noop;

    const contentsPromise = new Promise<Uint8Array[]>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    const { downloadControls } = initDownload({
        transformBlockStream,
        getBlocks,
        onStart: (stream) => resolve(streamToBuffer(stream)),
    });

    downloadControls.start(api).catch(reject);

    return {
        contents: contentsPromise,
        controls: downloadControls,
    };
};
