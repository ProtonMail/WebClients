import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { TransferState, TransferProgresses, TransferMeta } from '../../interfaces/transfer';
import { initDownload, DownloadControls, DownloadCallbacks } from './download';
import { useApi } from 'react-components';
import { ReadableStream } from 'web-streams-polyfill';

const MAX_ACTIVE_DOWNLOADS = 3;

export interface Download {
    id: string;
    meta: TransferMeta;
    state: TransferState;
    startDate: Date;
}

interface DownloadProviderState {
    downloads: Download[];
    addToDownloadQueue: (meta: TransferMeta, handlers: DownloadCallbacks) => Promise<ReadableStream<Uint8Array>>;
    getDownloadsProgresses: () => TransferProgresses;
    clearDownloads: () => void;
    cancelDownload: (id: string) => void;
    removeDownload: (id: string) => void;
}

const DownloadContext = createContext<DownloadProviderState | null>(null);

interface UserProviderProps {
    children: React.ReactNode;
}

export const DownloadProvider = ({ children }: UserProviderProps) => {
    const api = useApi();
    const controls = useRef<{ [id: string]: DownloadControls }>({});
    const progresses = useRef<TransferProgresses>({});

    const [downloads, setDownloads] = useState<Download[]>([]);

    const updateDownloadState = (id: string, state: TransferState) => {
        setDownloads((downloads) =>
            downloads.map((download) =>
                download.id === id &&
                download.state !== state &&
                (download.state !== TransferState.Canceled || state !== TransferState.Error)
                    ? { ...download, state }
                    : download
            )
        );
    };

    useEffect(() => {
        const activeDownloads = downloads.filter(({ state }) => state === TransferState.Progress);
        const nextPending = downloads.find(({ state }) => state === TransferState.Pending);

        if (activeDownloads.length < MAX_ACTIVE_DOWNLOADS && nextPending) {
            const { id } = nextPending;

            updateDownloadState(id, TransferState.Progress);

            controls.current[id]
                .start(api)
                .then(() => {
                    // Update download progress to 100% (for empty files, of transfer from buffer)
                    const download = downloads.find((download) => download.id === id);
                    if (download) {
                        progresses.current[id] = download.meta.size;
                    }
                    updateDownloadState(id, TransferState.Done);
                })
                .catch((err) => {
                    if (err.name === 'TransferCancel' || err.name === 'AbortError') {
                        updateDownloadState(id, TransferState.Canceled);
                    } else {
                        updateDownloadState(id, TransferState.Error);
                        throw err;
                    }
                });
        }
    }, [downloads]);

    const addToDownloadQueue = async (
        meta: TransferMeta,
        { transformBlockStream, onStart, onProgress }: DownloadCallbacks
    ) => {
        return new Promise<ReadableStream<Uint8Array>>((resolve) => {
            const { id, downloadControls } = initDownload({
                transformBlockStream,
                onProgress(bytes) {
                    progresses.current[id] += bytes;
                    onProgress?.(bytes);
                },
                onStart: (stream) => {
                    resolve(stream);
                    return onStart(stream);
                }
            });

            controls.current[id] = downloadControls;
            progresses.current[id] = 0;

            setDownloads((downloads) => [
                ...downloads,
                {
                    id,
                    meta,
                    state: TransferState.Pending,
                    startDate: new Date()
                }
            ]);
        });
    };

    const getDownloadsProgresses = () => ({ ...progresses.current });

    const clearDownloads = () => {
        // TODO: cancel pending downloads when implementing reject
        setDownloads([]);
    };

    const cancelDownload = (id: string) => {
        updateDownloadState(id, TransferState.Canceled);
        return controls.current[id].cancel();
    };

    const removeDownload = (id: string) => {
        setDownloads((downloads) => downloads.filter((download) => download.id !== id));
    };

    return (
        <DownloadContext.Provider
            value={{
                addToDownloadQueue,
                downloads,
                getDownloadsProgresses,
                clearDownloads,
                cancelDownload,
                removeDownload
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
