import { generateUID } from 'react-components';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { ReadableStream } from 'web-streams-polyfill';
import { createReadableStreamWrapper } from '@mattiasbuelens/web-streams-adapter';
import { DriveFileBlock } from '../../interfaces/file';
import { queryFileBlock } from '../../api/files';
import { untilStreamEnd, ObserverStream } from '../../utils/stream';
import { areUint8Arrays } from '../../utils/array';
import { Api } from 'proton-shared/lib/interfaces';
import { TransferCancel } from '../../interfaces/transfer';

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
    const id = generateUID('drive-download');
    const abortController = new AbortController();
    const fileStream = new ObserverStream();
    const fsWriter = fileStream.writable.getWriter();

    const start = async (api: Api) => {
        if (abortController.signal.aborted) {
            return;
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

        for (const block of orderedBlocks) {
            const blockStream = toPolyfillReadable(
                await api({ ...queryFileBlock(block.URL), timeout: 60000, signal: abortController.signal })
            ) as ReadableStream<Uint8Array>;

            const progressStream = new ObserverStream((value) => onProgress?.(value.length));
            const rawContentStream = blockStream.pipeThrough(progressStream);

            // Decrypt the file block content using streaming decryption
            const transformedContentStream = transformBlockStream
                ? await transformBlockStream(rawContentStream)
                : rawContentStream;

            await untilStreamEnd(transformedContentStream, (value) => {
                return fsWriter.write(value);
            });
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
