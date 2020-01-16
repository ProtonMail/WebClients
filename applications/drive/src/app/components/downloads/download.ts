import { generateUID } from 'react-components';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { ReadableStream } from 'web-streams-polyfill';
import { createReadableStreamWrapper } from '@mattiasbuelens/web-streams-adapter';
import { DriveFileBlock } from '../../interfaces/file';
import { queryFileBlock } from '../../api/files';
import { untilStreamEnd, ObserverStream } from '../../utils/stream';

const toPolyfillReadable = createReadableStreamWrapper(ReadableStream);

export type StreamTransformer = (stream: ReadableStream<Uint8Array>) => Promise<ReadableStream<Uint8Array>>;

export interface DownloadControls {
    start: (api: (query: any) => any) => Promise<void>;
}

export interface DownloadCallbacks {
    transformBlockStream: StreamTransformer;
    onStart: (stream: ReadableStream<Uint8Array>) => Promise<DriveFileBlock[]>;
    onProgress?: (rawData: Uint8Array) => void;
}

export const initDownload = (config: DownloadCallbacks) => {
    const id = generateUID('drive-download');

    const start = async (api: (query: any) => any) => {
        const fileStream = new ObserverStream();

        const fsWriter = fileStream.writable.getWriter();
        const blocks = await config.onStart(fileStream.readable);

        const orderedBlocks: DriveFileBlock[] = orderBy(blocks, 'Index');

        for (const block of orderedBlocks) {
            const blockStream = toPolyfillReadable(await api(queryFileBlock(block.URL))) as ReadableStream<Uint8Array>;

            const progressStream = new ObserverStream(config.onProgress);
            const rawContentStream = blockStream.pipeThrough(progressStream);

            // Decrypt the file block content using streaming decryption
            const transformedContentStream = await config.transformBlockStream(rawContentStream);

            await untilStreamEnd(transformedContentStream, (value) => fsWriter.write(value));
        }

        fsWriter.close();
    };

    const downloadControls: DownloadControls = { start };

    return { id, downloadControls };
};
