import { generateUID } from 'react-components';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { ReadableStream } from 'web-streams-polyfill';
import { createReadableStreamWrapper } from '@mattiasbuelens/web-streams-adapter';
import { Api } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { DriveFileBlock } from '../../interfaces/file';
import { queryFileBlock } from '../../api/files';
import { ObserverStream, untilStreamEnd } from '../../utils/stream';
import { areUint8Arrays } from '../../utils/array';
import { TransferCancel } from '../../interfaces/transfer';
import runInQueue from '../../utils/runInQueue';
import { waitUntil } from '../../utils/async';

const MAX_THREADS_PER_DOWNLOAD = 3;
const MAX_TOTAL_BUFFER_SIZE = 10; // number of blocks
const DOWNLOAD_TIMEOUT = 60000;

const toPolyfillReadable = createReadableStreamWrapper(ReadableStream);

export type StreamTransformer = (stream: ReadableStream<Uint8Array>) => Promise<ReadableStream<Uint8Array>>;

export interface DownloadControls {
    start: (api: (query: any) => any) => Promise<void>;
    cancel: () => void;
}

export interface DownloadCallbacks {
    onStart: (stream: ReadableStream<Uint8Array>) => Promise<DriveFileBlock[] | Uint8Array[]>;
    onProgress?: (bytes: number) => void;
    transformBlockStream?: StreamTransformer;
}

export const initDownload = ({ onStart, onProgress, transformBlockStream }: DownloadCallbacks) => {
    const id = generateUID('drive-transfers');
    const abortController = new AbortController();
    const fileStream = new ObserverStream();
    const fsWriter = fileStream.writable.getWriter();

    const start = async (api: Api) => {
        if (abortController.signal.aborted) {
            throw new TransferCancel(id);
        }

        const blocksOrBuffer = await onStart(fileStream.readable);

        await fsWriter.ready;

        // If initialized with preloaded buffer instead of blocks to download
        if (areUint8Arrays(blocksOrBuffer)) {
            for (const buffer of blocksOrBuffer) {
                await fsWriter.write(buffer as Uint8Array);
            }
            await fsWriter.ready;
            return fsWriter.close();
        }

        const orderedBlocks: DriveFileBlock[] = orderBy(blocksOrBuffer, 'Index');

        let activeIndex = 0;
        const buffers: ({ done: boolean; chunks: Uint8Array[] } | undefined)[] = [];

        const flushBuffer = async (index: number) => {
            const currentBuffer = buffers[index];
            if (currentBuffer?.chunks.length) {
                for (const chunk of currentBuffer.chunks) {
                    await fsWriter.write(chunk);
                }
                buffers[index] = undefined;
            }
        };

        // Downloads several blocks at once, but streams sequentially only one block at a time
        // Other blocks are put into buffer until previous blocks have finished downloading
        const downloadQueue = orderedBlocks.map((block) => async (index: number) => {
            const blockStream = toPolyfillReadable(
                await api({
                    ...queryFileBlock(block.URL),
                    timeout: DOWNLOAD_TIMEOUT,
                    signal: abortController.signal
                })
            ) as ReadableStream<Uint8Array>;

            const progressStream = new ObserverStream((value) => onProgress?.(value.length));
            const rawContentStream = blockStream.pipeThrough(progressStream);

            // Decrypt the file block content using streaming decryption
            const transformedContentStream = transformBlockStream
                ? await transformBlockStream(rawContentStream)
                : rawContentStream;

            await waitUntil(
                () => buffers.filter(isTruthy).length < MAX_TOTAL_BUFFER_SIZE || abortController.signal.aborted
            );

            await untilStreamEnd(transformedContentStream, async (data) => {
                if (index === activeIndex) {
                    await flushBuffer(index);
                    await fsWriter.write(data);
                } else if (buffers[index]) {
                    buffers[index]?.chunks.push(data);
                } else {
                    buffers[index] = { done: false, chunks: [data] };
                }
            });

            const currentBuffer = buffers[index];

            if (index === activeIndex) {
                // If finished uploading active block, flush buffer for next blocks too
                for (let i = activeIndex + 1; i < orderedBlocks.length; i++) {
                    if (buffers[i]?.done) {
                        await flushBuffer(i);
                    } else {
                        // Assign next incomplete block as new active block
                        activeIndex = i;
                        return;
                    }
                }
            } else if (currentBuffer) {
                currentBuffer.done = true;
            }
        });

        try {
            await runInQueue(downloadQueue, MAX_THREADS_PER_DOWNLOAD);
        } catch (e) {
            abortController.abort();
            fsWriter.abort(e);
            throw e;
        }

        // Wait for stream to be flushed
        await fsWriter.ready;

        return fsWriter.close();
    };

    const cancel = () => {
        abortController.abort();

        fsWriter.abort(new TransferCancel(id));
    };

    const downloadControls: DownloadControls = { start, cancel };

    return { id, downloadControls };
};
