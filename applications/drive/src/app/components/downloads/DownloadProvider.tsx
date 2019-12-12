import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { generateUID, useApi } from 'react-components';
import { DriveFileBlock, DriveFile, DriveFileRevision } from '../../interfaces/file';
import { openDownloadStream, initDownloadSW } from './download';
import { queryFileBlock } from '../../api/files';
import { mergeUint8Arrays } from '../../utils/array';
import { orderBy } from 'proton-shared/lib/helpers/array';

export enum DownloadState {
    Pending = 'pending',
    Progress = 'progress',
    Done = 'done',
    Canceled = 'canceled'
}

type BlockTransformer = (buffer: Uint8Array) => Promise<Uint8Array>;

interface DownloadInfo {
    filename: string;
    File: DriveFile;
    Revision: DriveFileRevision;
}

interface Download extends DownloadInfo {
    id: string;
    state: DownloadState;
}

interface DownloadBlock {
    downloadId: string;
    block: DriveFileBlock;
}

interface DownloadConfig {
    [id: string]: {
        transform: BlockTransformer;
        stream: WritableStreamDefaultWriter<Uint8Array>; // Stream to service worker
    };
}

export interface DownloadProgresses {
    [id: string]: number;
}

interface DownloadProviderState {
    downloads: Download[];
    startDownload: (info: DownloadInfo, transform: BlockTransformer) => void;
    getDownloadsProgresses: () => DownloadProgresses;
}

const MAX_PROCESSING = 3; // Max processing blocks at once

const DownloadContext = createContext<DownloadProviderState | null>(null);

interface UserProviderProps {
    children: React.ReactNode;
}

export const DownloadProvider = ({ children }: UserProviderProps) => {
    const api = useApi();

    const downloadConfig = useRef<DownloadConfig>({});
    const progresses = useRef<DownloadProgresses>({});
    const blockQueue = useRef<DownloadBlock[]>([]);

    const [downloads, setDownloads] = useState<Download[]>([]);

    useEffect(() => {
        initDownloadSW().catch((error) =>
            console.error(
                'Available download size will be limited because service worker failed to start:',
                error.message
            )
        );
    }, []);

    const updateDownloadState = (id: string, state: DownloadState) => {
        setDownloads((downloads) =>
            downloads.map((download) => (download.id === id ? { ...download, state } : download))
        );
    };

    const downloadFileBlock = async ({ downloadId, block }: DownloadBlock) => {
        const stream: ReadableStream<Uint8Array> = await api(queryFileBlock(block.URL));
        const reader = stream.getReader();

        const processResponse = async (
            { done, value }: ReadableStreamReadResult<Uint8Array>,
            chunks: Uint8Array[] = []
        ): Promise<Uint8Array> => {
            if (done) {
                return mergeUint8Arrays(chunks, progresses.current[downloadId]);
            }

            progresses.current[downloadId] += value.length;

            const response = await reader.read();
            return processResponse(response, [...chunks, value]);
        };

        const response = await reader.read();
        return processResponse(response);
    };

    const processNextInQueue = async () => {
        if (blockQueue.current.length === 0) {
            return;
        }

        const processing = blockQueue.current.slice(0, MAX_PROCESSING);

        const results = await Promise.all(
            processing.map(async (downloadBlock) => {
                const { block, downloadId } = downloadBlock;
                const rawData = await downloadFileBlock(downloadBlock);
                const data = await downloadConfig.current[downloadBlock.downloadId].transform(rawData);
                return { block, downloadId, data };
            })
        );

        for (const { block, data, downloadId } of results) {
            const blockInQueue = blockQueue.current[0];

            if (!blockInQueue || downloadId !== blockInQueue.downloadId || block.URL !== blockInQueue.block.URL) {
                continue; // Download is canceled already
            }
            blockQueue.current.shift();

            const stream = downloadConfig.current[downloadId].stream;
            await stream.write(data);

            const isDownloadFinished = blockQueue.current.every((block) => downloadId !== block.downloadId);
            if (isDownloadFinished) {
                updateDownloadState(downloadId, DownloadState.Done);
                stream.close();
            }
        }

        processNextInQueue();
    };

    useEffect(() => {
        const isProcessingStated = blockQueue.current.length === 0;

        // When download is added or changes status, update queue
        for (const { id, state, Revision } of downloads) {
            if (blockQueue.current.length >= MAX_PROCESSING) {
                break;
            }

            if (state === DownloadState.Pending) {
                blockQueue.current.push(
                    ...orderBy(Revision.Blocks, 'Index').map((block) => ({ downloadId: id, block }))
                );
                updateDownloadState(id, DownloadState.Progress);
            }
        }

        if (isProcessingStated) {
            processNextInQueue();
        }
    }, [downloads]);

    const cancelDownload = (downloadId: string) => {
        blockQueue.current = blockQueue.current.filter((block) => block.downloadId !== downloadId);
        downloadConfig.current[downloadId].stream.close();
        updateDownloadState(downloadId, DownloadState.Canceled);
    };

    const startDownload = async (info: DownloadInfo, transform: BlockTransformer) => {
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
                state: DownloadState.Pending,
                ...info
            }
        ]);
    };

    const getDownloadsProgresses = () => ({ ...progresses.current });

    return (
        <DownloadContext.Provider
            value={{
                startDownload,
                downloads,
                getDownloadsProgresses
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
