import { c } from 'ttag';
import { ReadableStream } from 'web-streams-polyfill';

import { VERIFICATION_STATUS } from '@proton/crypto';
import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { BATCH_REQUEST_SIZE, MAX_THREADS_PER_DOWNLOAD, RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';
import isArrayOfUint8Array from '@proton/utils/isArrayOfUint8Array';
import orderBy from '@proton/utils/orderBy';

import { TransferCancel } from '../../../components/TransferManager/transfer';
import { waitUntil } from '../../../utils/async';
import { ObserverStream, untilStreamEnd } from '../../../utils/stream';
import { isTransferCancelError } from '../../../utils/transfer';
import { logError } from '../../_utils';
import { ValidationError } from '../../_utils';
import { MAX_DOWNLOADING_BLOCKS, MAX_RETRIES_BEFORE_FAIL, TIME_TO_RESET_RETRIES } from '../constants';
import { DownloadCallbacks, DownloadStreamControls } from '../interface';
import downloadBlock from './downloadBlock';

export type DownloadBlocksCallbacks = Omit<
    DownloadCallbacks,
    'getBlocks' | 'onInit' | 'onSignatureIssue' | 'getChildren' | 'getKeys' | 'onProgress'
> & {
    getBlocks: (
        abortSignal: AbortSignal,
        pagination: {
            FromBlockIndex: number;
            PageSize: number;
        }
    ) => Promise<DriveFileBlock[] | Uint8Array[]>;
    transformBlockStream?: (
        abortSignal: AbortSignal,
        stream: ReadableStream<Uint8Array>,
        EncSignature: string
    ) => Promise<{
        data: ReadableStream<Uint8Array>;
        verifiedPromise: Promise<VERIFICATION_STATUS>;
    }>;
    checkBlockSignature?: (abortSignal: AbortSignal, verifiedPromise: Promise<VERIFICATION_STATUS>) => Promise<void>;
    onProgress?: (bytes: number) => void;
};

/**
 * initDownload prepares download transfer for the DownloadProvider queue.
 * Download is not started right away, it has to be started explicitly by
 * DownloadProvider.
 * How the download itself starts, see start function inside.
 */
export default function initDownloadBlocks(
    name: string,
    {
        getBlocks,
        transformBlockStream,
        checkBlockSignature,
        onProgress,
        onError,
        onNetworkError,
        onFinish,
    }: DownloadBlocksCallbacks,
    downloadBlockCallback = downloadBlock
) {
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
    const start = () => {
        if (abortController.signal.aborted) {
            throw new TransferCancel({ message: `Transfer canceled` });
        }

        const buffers = new Map<number, { done: boolean; chunks: Uint8Array[] }>();
        let blocksOrBuffer: DriveFileBlock[] | Uint8Array[] = [];
        let fromBlockIndex = 1;

        let blocks: DriveFileBlock[] = [];
        let activeIndex = 1;

        const hasMorePages = (currentPageLength: number) => currentPageLength === BATCH_REQUEST_SIZE;

        const getBlocksPaged = async (pagination: { FromBlockIndex: number; PageSize: number }) => {
            try {
                blocksOrBuffer = await getBlocks(abortController.signal, pagination);
            } catch (err: any) {
                // If paused before blocks/meta is fetched (DOM Error), restart on resume pause
                if (paused && isTransferCancelError(err)) {
                    await waitUntil(() => paused === false);
                    await start();
                    return false;
                }
                throw err;
            }

            return true;
        };

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

        let lastConsecutiveRetryTs = Date.now();
        // Downloads several blocks at once, but streams sequentially only one block at a time
        // Other blocks are put into buffer until previous blocks have finished downloading
        const startDownload = async (blockQueue: DriveFileBlock[], numRetries = 0) => {
            if (!blockQueue.length) {
                return [];
            }
            activeIndex = blockQueue[0].Index;

            let ongoingNumberOfDownloads = 0;

            const retryDownload = async (activeIndex: number, refetchBlocks = false) => {
                revertProgress();
                abortController = new AbortController();
                if (refetchBlocks) {
                    const newBlocks = await getBlocks(abortController.signal, {
                        FromBlockIndex: fromBlockIndex,
                        PageSize: BATCH_REQUEST_SIZE,
                    });
                    if (isArrayOfUint8Array(newBlocks)) {
                        throw new Error('Unexpected Uint8Array block data');
                    }
                    blocksOrBuffer = newBlocks;
                    blocks = newBlocks;
                }

                let retryCount = 0;
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
                await waitUntil(() => paused === false && ongoingNumberOfDownloads === 0);
                await startDownload(getBlockQueue(activeIndex), retryCount);
            };

            const downloadQueue = blockQueue.map(({ Index, EncSignature, BareURL, Token }) => async () => {
                ongoingNumberOfDownloads++;
                try {
                    if (!buffers.get(Index)?.done) {
                        await waitUntil(() => buffers.size < MAX_DOWNLOADING_BLOCKS || abortController.signal.aborted);

                        if (abortController.signal.aborted) {
                            throw new TransferCancel({ message: `Transfer canceled` });
                        }

                        const blockStream = await downloadBlockCallback(abortController, BareURL, Token);

                        const progressStream = new ObserverStream((value) => {
                            if (abortController.signal.aborted) {
                                throw new TransferCancel({ message: `Transfer canceled` });
                            }
                            incompleteProgress.set(Index, (incompleteProgress.get(Index) ?? 0) + value.length);
                            onProgress?.(value.length);
                        });
                        const rawContentStream = blockStream.pipeThrough(progressStream);

                        // Decrypt the file block content using streaming decryption
                        const { data: transformedContentStream, verifiedPromise } = transformBlockStream
                            ? await transformBlockStream(abortController.signal, rawContentStream, EncSignature || '')
                            : {
                                  data: rawContentStream,
                                  verifiedPromise: Promise.resolve(VERIFICATION_STATUS.SIGNED_AND_VALID),
                              };

                        await untilStreamEnd(transformedContentStream, async (data) => {
                            if (abortController.signal.aborted) {
                                throw new TransferCancel({ message: `Transfer canceled` });
                            }
                            const buffer = buffers.get(Index);
                            if (buffer) {
                                buffer.chunks.push(data);
                            } else {
                                buffers.set(Index, { done: false, chunks: [data] });
                            }
                        });
                        await checkBlockSignature?.(abortController.signal, verifiedPromise);

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
                    if (e.status === HTTP_STATUS_CODE.NOT_FOUND && numRetries < MAX_RETRIES_BEFORE_FAIL) {
                        console.warn(`Blocks for download might have expired. Retry num: ${numRetries}`);
                        // Wait for all blocks to be finished to have proper activeIndex.
                        await waitUntil(() => ongoingNumberOfDownloads === 0);
                        return retryDownload(activeIndex, true);
                    }

                    // If we experience some slight issue on server side, lets try
                    // one more time before notyfing user in transfer manager.
                    // Be careful about too many attempts as that could be harmful
                    // for our servers - if we have traffic issue, retrying too
                    // many times could lead to longer downtime.
                    // Also, there is some issue mostly in Brave that during upload
                    // and download at the same time, we get weird network error
                    // (err::NET_FAILED with status code 200) which is also "fixed"
                    // by automatic retry.
                    if (getIsConnectionIssue(e) && numRetries < MAX_RETRIES_BEFORE_FAIL) {
                        console.warn(`Connection issue for block #${activeIndex} download. Retry num: ${numRetries}`);
                        // Wait for all blocks to be finished to have proper activeIndex.
                        await waitUntil(() => ongoingNumberOfDownloads === 0);
                        // Do not refetch blocks. Its not needed at this stage, and
                        // also getting block information is not protected from
                        // connection issues for now.
                        return retryDownload(activeIndex);
                    }

                    // Sometimes the error can be thrown from untilStreamEnd,
                    // where its simple network error during reading the stream.
                    // Would be nice if this could be avoided after refactor.
                    if (onNetworkError && getIsConnectionIssue(e)) {
                        revertProgress();

                        // onNetworkError sets the state of the transfer and
                        // the transfer can be resumed right away--therefore,
                        // pausing has to be done first to avoid race (resuming
                        // sooner than pausing).
                        paused = true;
                        onNetworkError(e);

                        // Transfer can be resumed faster than ongoing block
                        // downloads are aborted. Therefore, first we need to
                        // wait for all downloads to be done to avoid flushing
                        // the same buffer more than once.
                        await waitUntil(() => paused === false && ongoingNumberOfDownloads === 0);
                        await startDownload(getBlockQueue(activeIndex));
                        return;
                    }

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

        const run = async () => {
            // Downloads initial page
            if (!(await getBlocksPaged({ FromBlockIndex: fromBlockIndex, PageSize: BATCH_REQUEST_SIZE }))) {
                return;
            }

            await fsWriter.ready;

            // If initialized with preloaded buffer instead of blocks to download
            if (isArrayOfUint8Array(blocksOrBuffer)) {
                await preloadBuffer();
                return;
            }

            blocks = blocksOrBuffer;

            await startDownload(getBlockQueue());
            if (!(await downloadTheRestOfBlocks())) {
                return;
            }

            // Wait for stream to be flushed
            await fsWriter.ready;
            await fsWriter.close();
        };

        void run()
            .then(() => {
                onFinish?.();
            })
            .catch((err) => {
                if (err?.data?.Code === RESPONSE_CODE.NOT_FOUND) {
                    err = new ValidationError(c('Info').t`File "${name}" was deleted during download`);
                }

                abortController.abort();
                fsWriter.abort(err).catch(logError);
                onError?.(err);
            });

        return fileStream.readable;
    };

    const cancel = () => {
        paused = false;
        abortController.abort();
        const error = new TransferCancel({ message: `Transfer canceled` });
        fsWriter.abort(error).catch(logError);
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

    const downloadControls: DownloadStreamControls = {
        start,
        cancel,
        pause,
        resume,
    };

    return downloadControls;
}
