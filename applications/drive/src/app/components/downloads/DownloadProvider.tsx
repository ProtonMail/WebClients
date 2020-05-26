import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { TransferState, TransferProgresses, TransferMeta } from '../../interfaces/transfer';
import { initDownload, DownloadControls, DownloadCallbacks } from './download';
import { useApi, generateUID } from 'react-components';
import { ReadableStream } from 'web-streams-polyfill';
import { FILE_CHUNK_SIZE, MAX_THREADS_PER_DOWNLOAD } from '../../constants';

const MAX_DOWNLOAD_LOAD = 10; // 1 load unit = 1 chunk, i.e. block request

type PartialDownload = {
    id: string;
    partOf: string;
    meta: TransferMeta;
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
        filename: string
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

/**
 * Partial download is a part of another download (e.g. file when downloading a folder)
 */
const isPartialDownload = (download: PartialDownload | Download): download is PartialDownload => 'partOf' in download;
const isSingleDownload = (download: PartialDownload | Download): download is Download => !isPartialDownload(download);

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

    const getDownloadsProgresses = () => ({ ...progresses.current });

    const clearDownloads = () => {
        // TODO: cancel pending downloads when implementing reject
        setDownloads([]);
    };

    const cancelDownload = (id: string) => {
        updateDownloadState(id, TransferState.Canceled);
        controls.current[id].cancel();
    };

    const removeDownload = (id: string) => {
        setDownloads((downloads) =>
            downloads.filter((download) => {
                const isPartOfFolderDownload = isPartialDownload(download) && download.partOf === id;
                return download.id !== id && !isPartOfFolderDownload;
            })
        );
    };

    useEffect(() => {
        const activeDownloads = downloads.filter(({ state }) => state === TransferState.Progress);
        const nextPending = downloads.find(({ state }) => state === TransferState.Pending);
        const downloadLoad = activeDownloads.reduce((load, download) => {
            const chunks = Math.floor((download.meta.size ?? 0) / FILE_CHUNK_SIZE) + 1;
            const loadIncrease = Math.min(MAX_THREADS_PER_DOWNLOAD, chunks); // At most X threads are active at a time
            return load + loadIncrease;
        }, 0);

        if (downloadLoad < MAX_DOWNLOAD_LOAD && nextPending) {
            const { id } = nextPending;

            updateDownloadState(id, TransferState.Progress);

            controls.current[id]
                .start(api)
                .then(() => {
                    // Update download progress to 100% (for empty files, or transfers from buffer)
                    const download = downloads.find((download) => download.id === id);
                    if (download) {
                        progresses.current[id] = download.meta.size ?? 0;
                    }
                    updateDownloadState(id, TransferState.Done);
                })
                .catch((err) => {
                    if (err.name === 'TransferCancel' || err.name === 'AbortError') {
                        updateDownloadState(id, TransferState.Canceled);
                    } else {
                        console.error(`Download ${id} failed: ${err}`);
                        updateDownloadState(id, TransferState.Error);
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

    const addFolderToDownloadQueue = (filename: string) => {
        const files: { [id: string]: { meta: TransferMeta; controls: DownloadControls } } = {};
        const groupId = generateUID('drive-transfers');
        const partialsPromises: Promise<void>[] = [];

        const abortDownload = (groupId: string) => {
            Object.values(files).forEach(({ controls }) => controls.cancel());
            setDownloads((downloads) =>
                downloads.map((download) =>
                    isPartialDownload(download) && download.partOf === groupId
                        ? {
                              ...download,
                              state: TransferState.Canceled
                          }
                        : download
                )
            );
        };

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
            addDownload(meta: TransferMeta, { onProgress, onError, onFinish, ...rest }: DownloadCallbacks) {
                const promise = new Promise<void>((resolve, reject) => {
                    const { id, downloadControls } = initDownload({
                        ...rest,
                        onProgress(bytes) {
                            progresses.current[id] += bytes;
                            progresses.current[groupId] += bytes;
                            onProgress?.(bytes);
                        },
                        onFinish() {
                            resolve();
                            onFinish?.();
                        },
                        onError(err) {
                            reject(err);
                            onError?.(err);
                        }
                    });
                    progresses.current[id] = 0;
                    controls.current[id] = downloadControls;

                    files[id] = { meta, controls: downloadControls };
                });
                partialsPromises.push(promise);
            },
            startDownloads() {
                progresses.current[groupId] = 0;
                controls.current[groupId] = {
                    cancel: () => {
                        abortDownload(groupId);
                    },
                    start: async () => {
                        try {
                            // Partials are `Initializing` until Folder download is started, then partials are set to Pending
                            setDownloads((downloads) =>
                                downloads.map((download) =>
                                    download.id in files
                                        ? {
                                              ...download,
                                              state: TransferState.Pending
                                          }
                                        : download
                                )
                            );
                            await Promise.all(partialsPromises);
                        } catch (err) {
                            abortDownload(groupId);
                            throw err;
                        }
                    }
                };

                const size = Object.values(files).reduce((acc, { meta }) => acc + (meta.size ?? 0), 0);

                setDownloads((downloads) => [
                    ...downloads.map((download) =>
                        download.id === groupId
                            ? {
                                  ...download,
                                  meta: { filename, size, mimeType: 'Folder' },
                                  state: TransferState.Pending
                              }
                            : download
                    ),
                    ...Object.entries(files).map(([id, { meta }]) => ({
                        id,
                        meta,
                        partOf: groupId,
                        state: TransferState.Initializing
                    }))
                ]);
            }
        };
    };

    const visibleDownloads = downloads.filter(isSingleDownload);

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
