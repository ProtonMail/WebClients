import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useApi, generateUID } from '@proton/components';
import { ReadableStream } from 'web-streams-polyfill';
import {
    TransferState,
    TransferProgresses,
    TransferMeta,
    Download,
    PartialDownload,
    DownloadInfo,
} from '../../interfaces/transfer';
import { initDownload, DownloadControls, DownloadCallbacks } from './download';
import { FILE_CHUNK_SIZE, MAX_THREADS_PER_DOWNLOAD } from '../../constants';
import { LinkType } from '../../interfaces/link';
import {
    isTransferFailed,
    isTransferPaused,
    isTransferProgress,
    isTransferPending,
    isTransferCancelError,
} from '../../utils/transfer';
import { SupportedMimeTypes } from '../../utils/MimeTypeParser/constants';

const MAX_DOWNLOAD_LOAD = 10; // 1 load unit = 1 chunk, i.e. block request
type DownloadStateUpdater = TransferState | ((download: Download | PartialDownload) => TransferState);
type TransferStateUpdateInfo = { error?: Error; startDate?: Date; force?: boolean };

interface DownloadProviderState {
    downloads: Download[];
    addToDownloadQueue: (
        meta: TransferMeta,
        downloadInfo: DownloadInfo,
        handlers: DownloadCallbacks
    ) => Promise<ReadableStream<Uint8Array>>;
    addFolderToDownloadQueue: (
        filename: string,
        downloadInfo: DownloadInfo
    ) => {
        addDownload(
            meta: TransferMeta,
            downloadInfo: DownloadInfo,
            { onProgress, ...rest }: DownloadCallbacks
        ): Promise<void>;
        startDownloads(): void;
    };
    getDownloadsProgresses: () => TransferProgresses;
    clearDownloads: () => void;
    cancelDownload: (id: string) => void;
    pauseDownload: (id: string) => Promise<void>;
    resumeDownload: (id: string) => void;
    removeDownload: (id: string) => void;
}

const DownloadContext = createContext<DownloadProviderState | null>(null);

/**
 * Partial download is a part of another download (e.g. file when downloading a folder)
 */
const isPartialDownload = (download: PartialDownload | Download): download is PartialDownload => 'partOf' in download;

interface UserProviderProps {
    children: React.ReactNode;
}

export const DownloadProvider = ({ children }: UserProviderProps) => {
    const api = useApi();
    const callbacks = useRef<{ [id: string]: DownloadCallbacks }>({});
    const controls = useRef<{ [id: string]: DownloadControls }>({});
    const progresses = useRef<TransferProgresses>({});

    const [downloads, setDownloads] = useState<Download[]>([]);
    const [partialDownloads, setPartialDownloads] = useState<PartialDownload[]>([]);

    const getUpdateDownloadStates =
        (
            ids: string[],
            nextState: DownloadStateUpdater,
            { error, force = false, startDate }: TransferStateUpdateInfo = {}
        ) =>
        <T extends PartialDownload | Download>(downloads: T[]) =>
            downloads.map((download) => {
                const newState = typeof nextState === 'function' ? nextState(download) : nextState;
                return ids.includes(download.id) &&
                    (force || (download.state !== newState && !isTransferFailed({ state: download.state })))
                    ? {
                          ...download,
                          state: newState,
                          resumeState: isTransferPaused(download) ? newState : download.state,
                          startDate: download.startDate ?? startDate,
                          error,
                      }
                    : download;
            });

    const updateDownloadState = (
        id: string | string[],
        nextState: DownloadStateUpdater,
        info?: TransferStateUpdateInfo
    ) => {
        const ids = Array.isArray(id) ? id : [id];
        setDownloads(getUpdateDownloadStates(ids, nextState, info));
    };

    const updatePartialDownloadState = (
        id: string | string[],
        nextState: DownloadStateUpdater,
        info?: TransferStateUpdateInfo
    ) => {
        const ids = Array.isArray(id) ? id : [id];
        setPartialDownloads(getUpdateDownloadStates(ids, nextState, info));
    };

    const getDownloadsProgresses = () => ({ ...progresses.current });

    const clearDownloads = useCallback(() => {
        downloads.forEach(({ id }) => {
            controls.current[id].cancel();
        });
        progresses.current = {};
        callbacks.current = {};
        controls.current = {};
        setDownloads([]);
    }, [downloads]);

    const cancelDownload = (id: string) => {
        updateDownloadState(id, TransferState.Canceled);
        controls.current[id].cancel();
    };

    const pauseDownload = async (id: string) => {
        const download = downloads.find((download) => download.id === id);

        if (!download) {
            return;
        }

        if (isTransferProgress(download)) {
            await controls.current[id].pause();
        }
        updateDownloadState(id, TransferState.Paused);
    };

    const resumeDownload = (id: string) => {
        controls.current[id].resume();
        updateDownloadState(id, ({ resumeState }) => resumeState || TransferState.Progress);
    };

    const removeDownload = (id: string) => {
        setDownloads((downloads) =>
            downloads.filter((download) => {
                const isPartOfFolderDownload = isPartialDownload(download) && download.partOf === id;
                return download.id !== id && !isPartOfFolderDownload;
            })
        );
        delete controls.current[id];
        delete callbacks.current[id];
        delete progresses.current[id];
    };

    useEffect(() => {
        const allDownloads = [...partialDownloads, ...downloads];
        const downloading = allDownloads.filter(isTransferProgress);
        const nextPending = allDownloads.find(isTransferPending);
        const downloadLoad = downloading.reduce((load, download) => {
            if (download.type === LinkType.FOLDER) {
                return load;
            }
            const chunks = Math.floor((download.meta.size ?? 0) / FILE_CHUNK_SIZE) + 1;
            const loadIncrease = Math.min(MAX_THREADS_PER_DOWNLOAD, chunks); // At most X threads are active at a time
            return load + loadIncrease;
        }, 0);

        if (downloadLoad < MAX_DOWNLOAD_LOAD && nextPending) {
            const { id } = nextPending;
            const updateState = isPartialDownload(nextPending) ? updatePartialDownloadState : updateDownloadState;

            updateState(id, TransferState.Progress);

            controls.current[id]
                .start(api)
                .then(() => {
                    // Update download progress to 100% (for empty files, or transfers from buffer)
                    const download = allDownloads.find((download) => download.id === id);
                    if (download) {
                        progresses.current[id] = download.meta.size ?? 0;
                    }
                    updateState(id, TransferState.Done);
                })
                .catch((error: Error) => {
                    if (isTransferCancelError(error)) {
                        updateState(id, TransferState.Canceled);
                    } else {
                        console.error(error);
                        console.error(`Download ${id} failed: ${error}`);
                        updateState(id, TransferState.Error, { error });
                    }
                });
        }
    }, [downloads, partialDownloads]);

    const addToDownloadQueue = async (meta: TransferMeta, downloadInfo: DownloadInfo, cb: DownloadCallbacks) => {
        return new Promise<ReadableStream<Uint8Array>>((resolve) => {
            const { id, downloadControls } = initDownload({
                ...cb,
                onProgress(bytes) {
                    progresses.current[id] += bytes;
                    cb.onProgress?.(bytes);
                },
                onStart: (stream) => {
                    resolve(stream);
                    return cb.onStart?.(stream);
                },
                onNetworkError: (id, err) => {
                    updateDownloadState(id, TransferState.NetworkError, { error: err });
                    cb.onNetworkError?.(id, err);
                },
            });

            callbacks.current[id] = cb;
            controls.current[id] = downloadControls;
            progresses.current[id] = 0;

            setDownloads((downloads) => [
                ...downloads,
                {
                    id,
                    meta,
                    downloadInfo,
                    state: TransferState.Pending,
                    startDate: new Date(),
                    type: LinkType.FILE,
                },
            ]);
        });
    };

    const addFolderToDownloadQueue = (folderName: string, downloadInfo: DownloadInfo) => {
        const files: {
            [id: string]: { meta: TransferMeta; controls: DownloadControls; downloadInfo: DownloadInfo };
        } = {};
        const groupId = generateUID('drive-transfers');
        const partialsPromises: Promise<void>[] = [];
        const folderMeta = {
            filename: folderName.endsWith('.zip') ? folderName : `${folderName}.zip`,
            mimeType: SupportedMimeTypes.zip,
        };
        let aborted = false;

        const abortPartialDownloads = () => {
            aborted = true;
            Object.values(files).forEach(({ controls }) => controls.cancel());
            updatePartialDownloadState(Object.keys(files), TransferState.Canceled);
        };

        progresses.current[groupId] = 0;
        controls.current[groupId] = {
            resume: () => {
                Object.values(files).forEach(({ controls }) => controls.resume());
                updatePartialDownloadState(
                    Object.keys(files),
                    ({ resumeState }) => resumeState || TransferState.Progress
                );
            },
            pause: async () => {
                updatePartialDownloadState(Object.keys(files), TransferState.Paused);
                await Promise.all(Object.values(files).map(({ controls }) => controls.pause()));
            },
            cancel: () => {
                updateDownloadState(groupId, TransferState.Canceled);
                abortPartialDownloads();
            },
            start: async () => {
                try {
                    // Partials are `Initializing` until Folder download is started, then partials are set to Pending
                    updatePartialDownloadState(Object.keys(files), TransferState.Pending, {
                        force: true,
                    });
                    await Promise.all(partialsPromises);
                } catch (err) {
                    abortPartialDownloads();
                    throw err;
                }
            },
        };

        setDownloads((downloads) => [
            ...downloads,
            {
                id: groupId,
                meta: folderMeta,
                downloadInfo,
                state: TransferState.Initializing,
                startDate: new Date(),
                type: LinkType.FOLDER,
            },
        ]);

        return {
            async addDownload(meta: TransferMeta, downloadInfo: DownloadInfo, cb: DownloadCallbacks) {
                if (aborted) {
                    throw new Error(`Parent download (${groupId}) is already canceled`);
                }

                const promise = new Promise<void>((resolve, reject) => {
                    const { id, downloadControls } = initDownload({
                        ...cb,
                        onProgress(bytes) {
                            progresses.current[id] += bytes;
                            progresses.current[groupId] += bytes;
                            cb.onProgress?.(bytes);
                        },
                        onFinish() {
                            resolve();
                            cb.onFinish?.();
                        },
                        onError(err) {
                            reject(err);
                            cb.onError?.(err);
                        },
                        onNetworkError: (id, err) => {
                            updateDownloadState(groupId, TransferState.NetworkError, { error: err });
                            updatePartialDownloadState(id, TransferState.NetworkError, { error: err });
                            cb.onNetworkError?.(id, err);
                        },
                    });
                    progresses.current[id] = 0;
                    controls.current[id] = downloadControls;
                    callbacks.current[id] = cb;

                    files[id] = { meta, controls: downloadControls, downloadInfo };
                });
                partialsPromises.push(promise);
            },
            startDownloads() {
                if (aborted) {
                    throw new Error(`Parent download (${groupId}) is already canceled`);
                }

                const size = Object.values(files).reduce((acc, { meta }) => acc + (meta.size ?? 0), 0);

                setDownloads((downloads) =>
                    downloads.map((download) =>
                        download.id === groupId
                            ? {
                                  ...download,
                                  meta: { ...folderMeta, size },
                                  state: TransferState.Pending,
                              }
                            : download
                    )
                );

                setPartialDownloads((partialDownloads) => [
                    ...partialDownloads,
                    ...Object.entries(files).map(([id, { meta, downloadInfo }]) => ({
                        id,
                        meta,
                        downloadInfo,
                        partOf: groupId,
                        state: TransferState.Initializing,
                        type: LinkType.FILE,
                        startDate: new Date(),
                    })),
                ]);
            },
        };
    };

    return (
        <DownloadContext.Provider
            value={{
                addToDownloadQueue,
                downloads,
                getDownloadsProgresses,
                clearDownloads,
                cancelDownload,
                removeDownload,
                addFolderToDownloadQueue,
                pauseDownload,
                resumeDownload,
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
