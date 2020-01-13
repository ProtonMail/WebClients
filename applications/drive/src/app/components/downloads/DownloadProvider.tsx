import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { generateUID, useApi } from 'react-components';
import { createReadableStreamWrapper, ReadableStreamLike } from '@mattiasbuelens/web-streams-adapter';
import { ReadableStream as PolyfillReadableStream } from 'web-streams-polyfill';
import { DriveFileBlock, DriveFile, DriveFileRevision } from '../../interfaces/file';
import { openDownloadStream, initDownloadSW } from './download';
import { queryFileBlock } from '../../api/files';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { TransferState, TransferProgresses } from '../../interfaces/transfer';

const toPolyfillReadable = createReadableStreamWrapper(PolyfillReadableStream);

const MAX_ACTIVE_DOWNLOADS = 3;

type StreamTransformer = (stream: ReadableStream<Uint8Array>) => Promise<ReadableStream<Uint8Array>>;

interface DownloadInfo {
    filename: string;
    File: DriveFile;
    Revision: DriveFileRevision;
}

export interface Download {
    id: string;
    info: DownloadInfo;
    state: TransferState;
    startDate: Date;
}

interface DownloadConfig {
    [id: string]: {
        transform: StreamTransformer;
        stream: WritableStreamDefaultWriter<Uint8Array>; // Stream to service worker
    };
}

interface DownloadProviderState {
    downloads: Download[];
    startDownload: (info: DownloadInfo, transform: StreamTransformer) => void;
    getDownloadsProgresses: () => TransferProgresses;
    clearDownloads: () => void;
}

const DownloadContext = createContext<DownloadProviderState | null>(null);

interface UserProviderProps {
    children: React.ReactNode;
}

export const DownloadProvider = ({ children }: UserProviderProps) => {
    const api = useApi();

    const downloadConfig = useRef<DownloadConfig>({});
    const progresses = useRef<TransferProgresses>({});

    const [downloads, setDownloads] = useState<Download[]>([]);

    useEffect(() => {
        initDownloadSW().catch((error) =>
            console.error(
                'Available download size will be limited because service worker failed to start:',
                error.message
            )
        );
    }, []);

    const updateDownloadState = (id: string, state: TransferState) => {
        setDownloads((downloads) =>
            downloads.map((download) => (download.id === id ? { ...download, state } : download))
        );
    };

    const downloadFileBlock = async (
        downloadId: string,
        block: DriveFileBlock,
        onChunkRead: (data: Uint8Array) => Promise<void>
    ) => {
        const stream: ReadableStreamLike<Uint8Array> = toPolyfillReadable(await api(queryFileBlock(block.URL)));

        const [encStream, decStream] = (stream as any).tee();

        const decryptedStream = await downloadConfig.current[downloadId].transform(decStream);
        const reader = decryptedStream.getReader();
        const encReader = encStream.getReader();

        const processProgress = async ({ done, value }: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
            if (done) {
                return;
            }
            progresses.current[downloadId] += value.length;
            return processProgress(await encReader.read());
        };

        const processResponse = async ({ done, value }: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
            if (done) {
                return;
            }
            await onChunkRead(value);
            return processResponse(await reader.read());
        };

        return Promise.all([processProgress(await encReader.read()), processResponse(await reader.read())]);
    };

    const downloadFile = async ({ id, info }: Download) => {
        updateDownloadState(id, TransferState.Progress);

        const blocks: DriveFileBlock[] = orderBy(info.Revision.Blocks, 'Index');
        const workerStream = downloadConfig.current[id].stream;

        try {
            for (const block of blocks) {
                await downloadFileBlock(id, block, (value: Uint8Array) => workerStream.write(value));
            }
            updateDownloadState(id, TransferState.Done);
        } catch (e) {
            updateDownloadState(id, TransferState.Error);
        }
        workerStream.close();
    };

    useEffect(() => {
        const activeDownloads = downloads.filter(({ state }) => state === TransferState.Progress);
        const nextPending = downloads.find(({ state }) => state === TransferState.Pending);

        if (activeDownloads.length < MAX_ACTIVE_DOWNLOADS && nextPending) {
            downloadFile(nextPending);
        }
    }, [downloads]);

    const cancelDownload = (downloadId: string) => {
        // TODO: stop sending requests when implementing rejection/pause
        downloadConfig.current[downloadId].stream.close();
        updateDownloadState(downloadId, TransferState.Canceled);
    };

    const startDownload = async (info: DownloadInfo, transform: StreamTransformer) => {
        const id = generateUID('drive-download');
        const stream = await openDownloadStream(
            {
                filename: info.filename,
                mimeType: info.File.MimeType,
                size: info.Revision.Size
            },
            { onCancel: () => cancelDownload(id) }
        );

        progresses.current[id] = 0;
        downloadConfig.current[id] = {
            transform,
            stream: stream.getWriter()
        };

        setDownloads((downloads) => [
            ...downloads,
            {
                id,
                info,
                state: TransferState.Pending,
                startDate: new Date()
            }
        ]);
    };

    const getDownloadsProgresses = () => ({ ...progresses.current });
    const clearDownloads = () => {
        // TODO: cancel pending downloads when implementing reject
        setDownloads([]);
    };

    return (
        <DownloadContext.Provider
            value={{
                startDownload,
                downloads,
                getDownloadsProgresses,
                clearDownloads
            }}
        >
            {children}
        </DownloadContext.Provider>
    );
};

export const useDownloadProvider = () => {
    const state = useContext(DownloadContext);
    if (!state) {
        throw new Error('Trying to use uninitialized DownloadProvider');
    }
    return state;
};
