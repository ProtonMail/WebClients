import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { TransferState, TransferProgresses, TransferMeta, TransferCancel } from '../../interfaces/transfer';
import { initDownload, DownloadControls, DownloadCallbacks } from './download';
import { useApi, generateUID } from 'react-components';
import { ReadableStream } from 'web-streams-polyfill';

const MAX_ACTIVE_DOWNLOADS = 3;

type PartialDownload = {
    id: string;
    partOf: string;
    state: TransferState;
};

export type Download = {
    id: string;
    meta: TransferMeta;
    state: TransferState;
    startDate: Date;
};

interface DownloadProviderState {
    downloads: Download[];
    addToDownloadQueue: (meta: TransferMeta, handlers: DownloadCallbacks) => Promise<ReadableStream<Uint8Array>>;
    addFolderToDownloadQueue: (
        filename: string,
        cb?: { onCancel: (reason: any) => void }
    ) => {
        addDownload(meta: TransferMeta, { onProgress, ...rest }: DownloadCallbacks): void;
        startDownloads(): void;
    };
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

    const [downloads, setDownloads] = useState<(Download | PartialDownload)[]>([]);

    const updateDownloadState = (id: string | string[], state: TransferState) => {
        const ids = Array.isArray(id) ? id : [id];
        setDownloads((downloads) =>
            downloads.map((download) =>
                ids.includes(download.id) &&
                download.state !== state &&
                (download.state !== TransferState.Canceled || state !== TransferState.Error)
                    ? { ...download, state }
                    : download
            )
        );
    };

    const getPartialsOf = (id: string) =>
        downloads.filter((download) => 'partOf' in download && download.partOf === id).map(({ id }) => id);

    const getDownloadsProgresses = () => ({ ...progresses.current });

    const clearDownloads = () => {
        // TODO: cancel pending downloads when implementing reject
        setDownloads([]);
    };

    const cancelDownload = (id: string) => {
        const partials = getPartialsOf(id);

        updateDownloadState([id, ...partials], TransferState.Canceled);

        partials.forEach((id) => controls.current[id].cancel());
        controls.current[id].cancel();
    };

    const removeDownload = (id: string) => {
        const partials = getPartialsOf(id);
        setDownloads((downloads) => downloads.filter((download) => download.id !== id && !partials.includes(id)));
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
                    // Update download progress to 100% (for empty files, or transfers from buffer)
                    const download = downloads.find((download) => download.id === id);
                    if (download && 'meta' in download) {
                        progresses.current[id] = download.meta.size ?? 0;
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

    const addToDownloadQueue = async (meta: TransferMeta, { onStart, onProgress, ...rest }: DownloadCallbacks) => {
        return new Promise<ReadableStream<Uint8Array>>((resolve) => {
            const { id, downloadControls } = initDownload({
                ...rest,
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

    const addFolderToDownloadQueue = (filename: string, cb?: { onCancel: (reason: any) => void }) => {
        const files: { [id: string]: TransferMeta } = {};
        const groupId = generateUID('drive-transfers');
        const partialsPromises: Promise<void>[] = [];

        setDownloads((downloads) => [
            ...downloads,
            {
                id: groupId,
                meta: { filename, mimeType: 'Folder' },
                state: TransferState.Initializing,
                startDate: new Date()
            }
        ]);

        return {
            addDownload(meta: TransferMeta, { onProgress, ...rest }: DownloadCallbacks) {
                const promise = new Promise<void>((resolve) => {
                    const { id, downloadControls } = initDownload({
                        ...rest,
                        onProgress(bytes) {
                            progresses.current[id] += bytes;
                            progresses.current[groupId] += bytes;
                            onProgress?.(bytes);
                        },
                        onFinish() {
                            resolve();
                        }
                    });
                    progresses.current[id] = 0;
                    controls.current[id] = downloadControls;

                    files[id] = meta;
                });
                partialsPromises.push(promise);
            },
            startDownloads() {
                setDownloads((downloads) => {
                    progresses.current[groupId] = 0;
                    controls.current[groupId] = {
                        cancel: () => {
                            cb?.onCancel(new TransferCancel(groupId));
                        },
                        start: async () => {
                            // Partials are `Initializing` until Folder download is started, then partials are set to Pending
                            setDownloads((downloads) =>
                                downloads.map((download) => {
                                    if (download.id in files) {
                                        return {
                                            ...download,
                                            state: TransferState.Pending
                                        };
                                    }
                                    return download;
                                })
                            );
                            await Promise.all(partialsPromises);
                        }
                    };

                    let size = 0;
                    return [
                        ...downloads.filter(({ id }) => id !== groupId),
                        ...Object.entries(files).map(([id, meta]) => {
                            size += meta.size ?? 0;
                            return {
                                id,
                                partOf: groupId,
                                state: TransferState.Initializing
                            };
                        }),
                        {
                            id: groupId,
                            meta: { filename, size, mimeType: 'Folder' },
                            state: TransferState.Pending,
                            startDate: new Date()
                        }
                    ];
                });
            }
        };
    };

    const visibleDownloads = downloads.filter((download): download is Download => !('partOf' in download));

    return (
        <DownloadContext.Provider
            value={{
                addToDownloadQueue,
                downloads: visibleDownloads,
                getDownloadsProgresses,
                clearDownloads,
                cancelDownload,
                removeDownload,
                addFolderToDownloadQueue
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
