import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import * as React from 'react';

import { useModals } from '@proton/components';

import { waitUntil } from '../../utils/async';
import { TransferState, TransferProgresses, Upload, PreUploadData, TransferCancel } from '../../interfaces/transfer';
import {
    isTransferActive,
    isTransferConflict,
    isTransferProgress,
    isTransferPending,
    isTransferFailed,
    isTransferCancelError,
    isTransferPaused,
    isTransferFinished,
} from '../../utils/transfer';
import { initUpload, UploadControls, UploadCallbacks, TransferConflictStrategy } from './upload';
import ConflictModal from './ConflictModal';

// Empty string is ensured to not conflict with any upload ID or folder name.
const CONFLICT_STRATEGY_ALL_ID = '';

type UploadStateUpdater = TransferState | ((upload: Upload) => TransferState);

interface UploadProviderState {
    uploads: Upload[];
    addToUploadQueue: (data: PreUploadData, metadataPromise: Promise<any>, callbacks: UploadCallbacks) => Promise<void>;
    getUploadsProgresses: () => TransferProgresses;
    getUploadsImmediate: () => Upload[];
    clearUploads: () => void;
    removeUpload: (id: string) => void;
    cancelUpload: (id: string) => void;
    pauseUpload: (id: string) => void;
    resumeUpload: (id: string) => void;
    getAbortController: () => AbortController;
    getFolderConflictStrategy: (
        parentId: string,
        name: string,
        originalIsFolder: boolean
    ) => Promise<TransferConflictStrategy>;
}

const MAX_ACTIVE_UPLOADS = 3;

const UploadContext = createContext<UploadProviderState | null>(null);

interface UserProviderProps {
    children: React.ReactNode;
}

export const UploadProvider = ({ children }: UserProviderProps) => {
    const { createModal } = useModals();

    // Keeping ref in case we need to immediately get uploads without waiting for rerender
    const uploadsRef = useRef<Upload[]>([]);
    const [uploads, setUploads] = useState<Upload[]>([]);
    const controls = useRef<{ [id: string]: UploadControls }>({});
    const progresses = useRef<TransferProgresses>({});
    const abortRef = useRef(new AbortController());

    // There should be always only one modal to chose conflict strategy visible.
    const isConflictStrategyModalOpen = useRef(false);
    // Conflict strategy is set per upload, or CONFLICT_STRATEGY_ALL_ID is used.
    // Strategies are cleared once all uploads are finished so user is asked
    // again (consider that user could do another upload after an hour).
    const fileConflictStrategy = useRef<{ [id: string]: TransferConflictStrategy }>({});
    const folderConflictStrategy = useRef<{ [name: string]: TransferConflictStrategy }>({});
    // Folders are not handled by provider (maybe it would be good to refactor
    // it one day) and therefore we need to keep track of conflicting ones to
    // handle conflict modals.
    const [conflictingFolders, setConflictingFolders] = useState<
        { parentId: string; name: string; originalIsFolder: boolean }[]
    >([]);

    const removeUpload = (id: string) => {
        uploadsRef.current = uploadsRef.current.filter((upload) => upload.id !== id);
        delete controls.current[id];
        delete progresses.current[id];
        setUploads(uploadsRef.current);
    };

    const addNewUpload = (id: string, preUploadData: PreUploadData) => {
        const { file } = preUploadData;
        uploadsRef.current = [
            ...uploadsRef.current,
            {
                id,
                meta: {
                    filename: file.name,
                    mimeType: file.type,
                    size: file.size,
                },
                preUploadData,
                state: TransferState.Initializing,
                startDate: new Date(),
            },
        ];
        setUploads(uploadsRef.current);
    };

    const clearUploads = useCallback(() => {
        abortRef.current.abort();
        uploadsRef.current.forEach((upload) => {
            if (!isTransferFinished(upload)) {
                controls.current[upload.id].cancel();
            }
        });
        uploadsRef.current = [];
        progresses.current = {};
        setUploads(uploadsRef.current);
        abortRef.current = new AbortController();
    }, []);

    const updateUploadState = (id: string, nextState: UploadStateUpdater, data: Partial<Upload> = {}) => {
        const currentUpload = uploadsRef.current.find((upload) => upload.id === id);
        if (currentUpload && !isTransferFailed(currentUpload)) {
            const newState = typeof nextState === 'function' ? nextState(currentUpload) : nextState;
            uploadsRef.current = uploadsRef.current.map((upload) =>
                upload.id === id
                    ? {
                          ...upload,
                          ...data,
                          resumeState: isTransferPaused(currentUpload) ? newState : currentUpload.state,
                          state: newState,
                      }
                    : upload
            );
            setUploads(uploadsRef.current);
        }
    };

    const cancelUpload = (id: string) => {
        updateUploadState(id, TransferState.Canceled);
        controls.current[id].cancel();
    };

    const pauseUpload = async (id: string) => {
        const upload = uploads.find((upload) => upload.id === id);

        if (!upload) {
            return;
        }

        if (isTransferProgress(upload) || isTransferPending(upload)) {
            controls.current[id].pause();
        }

        updateUploadState(id, TransferState.Paused);
    };

    const resumeUpload = (id: string) => {
        controls.current[id].resume();
        updateUploadState(id, ({ resumeState }) => resumeState || TransferState.Progress);
    };

    const getFileConflictStrategy = (id: string): TransferConflictStrategy | undefined => {
        return fileConflictStrategy.current[CONFLICT_STRATEGY_ALL_ID] || fileConflictStrategy.current[id];
    };

    const openFileConflictStrategyModal = (id: string, filename: string) => {
        isConflictStrategyModalOpen.current = true;

        const apply = (strategy: TransferConflictStrategy, all: boolean) => {
            isConflictStrategyModalOpen.current = false;
            fileConflictStrategy.current[all ? CONFLICT_STRATEGY_ALL_ID : id] = strategy;
            if (all) {
                uploadsRef.current
                    .filter((upload) => isTransferConflict(upload))
                    .map((upload) => resumeUpload(upload.id));
            } else {
                resumeUpload(id);
            }
        };
        const cancelAll = () => {
            uploadsRef.current.filter((upload) => isTransferActive(upload)).map((upload) => cancelUpload(upload.id));
            // cancelUpload triggers useEffect every time, therefore we need
            // to set that modal is not open after all changes so its not
            // open again in the middle.
            isConflictStrategyModalOpen.current = false;
        };
        createModal(<ConflictModal name={filename} apply={apply} cancelAll={cancelAll} />);
    };

    // Folders are not handled by provider (maybe it would be good one day refactor)
    // and therefore getFolderConflictStrategy returns promise for the strategy.
    // Promise is rejected when upload is cancelled. It is ensured only one modal
    // is opened, see effect opening modals below.
    const getFolderConflictStrategy = async (
        parentId: string,
        name: string,
        originalIsFolder: boolean
    ): Promise<TransferConflictStrategy> => {
        const getFolderStrategyInner = (): TransferConflictStrategy | undefined => {
            return (
                folderConflictStrategy.current[CONFLICT_STRATEGY_ALL_ID] ||
                folderConflictStrategy.current[parentId + name]
            );
        };

        const strategy = getFolderStrategyInner();
        if (strategy) {
            return strategy;
        }

        setConflictingFolders((folders) => [...folders, { parentId, name, originalIsFolder }]);

        const { signal } = abortRef.current;
        return new Promise((resolve, reject) => {
            waitUntil(() => {
                return !!getFolderStrategyInner();
            }, signal)
                .then(() => {
                    const strategy = getFolderStrategyInner() as TransferConflictStrategy;
                    resolve(strategy);
                })
                .catch(() => {
                    reject(new TransferCancel({ message: `Upload was canceled` }));
                });
        });
    };

    const openFolderConflictStrategyModal = (parentId: string, name: string, originalIsFolder: boolean) => {
        isConflictStrategyModalOpen.current = true;

        const apply = (strategy: TransferConflictStrategy, all: boolean) => {
            isConflictStrategyModalOpen.current = false;
            folderConflictStrategy.current[all ? CONFLICT_STRATEGY_ALL_ID : parentId + name] = strategy;
            if (all) {
                setConflictingFolders([]);
            } else {
                setConflictingFolders((folders) =>
                    folders.filter((folder) => folder.parentId !== parentId || folder.name !== name)
                );
            }
        };
        const cancelAll = () => {
            uploadsRef.current.filter((upload) => isTransferActive(upload)).map((upload) => cancelUpload(upload.id));
            setConflictingFolders([]);
            // cancelUpload triggers useEffect every time, therefore we need
            // to set that modal is not open after all changes so its not
            // open again in the middle.
            isConflictStrategyModalOpen.current = false;
            abortRef.current.abort();
            abortRef.current = new AbortController();
        };
        createModal(
            <ConflictModal
                name={name}
                isFolder
                originalIsFolder={originalIsFolder}
                apply={apply}
                cancelAll={cancelAll}
            />
        );
    };

    // Modals are openned on this one place only to not have race condition
    // issue and ensure only one modal, either for file or folder, is openned.
    useEffect(() => {
        if (isConflictStrategyModalOpen.current) {
            return;
        }

        const conflictingUpload = uploadsRef.current.filter((upload) => upload.state === TransferState.Conflict)[0];
        if (conflictingUpload) {
            openFileConflictStrategyModal(conflictingUpload.id, conflictingUpload.meta.filename);
            return;
        }

        const conflictingFolder = conflictingFolders[0];
        if (conflictingFolder) {
            openFolderConflictStrategyModal(
                conflictingFolder.parentId,
                conflictingFolder.name,
                conflictingFolder.originalIsFolder
            );
        }
    }, [uploads, conflictingFolders]);

    useEffect(() => {
        const uploadingOrReady = uploads.filter(
            (upload) => isTransferProgress(upload) || (isTransferPending(upload) && upload.ready)
        );
        const nextQueued = uploads.find((upload) => isTransferPending(upload) && !upload.ready);
        const conflictingUpload = Boolean(
            uploadsRef.current.filter((upload) => upload.state === TransferState.Conflict).length ||
                conflictingFolders.length
        );

        // No upload should be started if conflict strategy modal is open.
        // It needs to wait for user action due to "cancel all" option.
        if (uploadingOrReady.length < MAX_ACTIVE_UPLOADS && nextQueued && !conflictingUpload) {
            const { id } = nextQueued;

            updateUploadState(id, TransferState.Pending, {
                ready: true,
            });

            controls.current[id]
                .start()
                .then(() => {
                    // Update upload progress to 100%
                    const upload = uploads.find((upload) => upload.id === id);
                    if (upload) {
                        progresses.current[id] = upload.meta.size ?? 0;
                    }
                    updateUploadState(id, TransferState.Done);
                })
                .catch((error) => {
                    console.error(`Upload ${id} failed: ${error}`);
                    if (isTransferCancelError(error)) {
                        updateUploadState(id, TransferState.Canceled);
                    } else {
                        updateUploadState(id, TransferState.Error, { error });
                    }
                });
        }

        // "Apply to all" should be active till the last transfer is active.
        // Once all transfers finish, user can start another minutes or hours
        // later and that means we should ask again.
        const hasNoActiveUpload = !uploads.find((upload) => isTransferActive(upload));
        if (hasNoActiveUpload) {
            // Small delay clearing to overcome also uploads of folders only.
            // When upload of empty folder is done, no active upload is present
            // and thus cleared right away and chosen operation never done.
            setTimeout(() => {
                fileConflictStrategy.current = {};
                folderConflictStrategy.current = {};
            }, 100);
        }
    }, [uploads, conflictingFolders]);

    const addToUploadQueue = async (
        preUploadData: PreUploadData,
        setupPromise: Promise<any>,
        callbacks: UploadCallbacks
    ) =>
        new Promise<void>((resolve, reject) => {
            const { id, uploadControls } = initUpload(preUploadData.file, {
                ...callbacks,
                initialize: async (abortSignal) => {
                    const init = async (): Promise<{ filename: string; MIMEType: string }> => {
                        try {
                            const result = await callbacks.initialize(abortSignal, getFileConflictStrategy(id));
                            if (!abortSignal.aborted) {
                                updateUploadState(id, TransferState.Progress, {
                                    meta: {
                                        size: preUploadData.file.size,
                                        mimeType: result.MIMEType,
                                        filename: result.filename,
                                    },
                                });
                            }
                            return result;
                        } catch (err) {
                            if (err.name !== 'TransferConflict') {
                                throw err;
                            }
                            updateUploadState(id, TransferState.Conflict);
                            await waitUntil(() => {
                                const upload = uploadsRef.current.filter((upload) => upload.id === id)[0];
                                return upload?.state !== TransferState.Conflict;
                            }, abortSignal);
                            return init();
                        }
                    };
                    return init();
                },
                finalize: async (blocklist, config) => {
                    updateUploadState(id, TransferState.Finalizing);
                    await callbacks.finalize(blocklist, config);
                    resolve();
                },
                onProgress: (bytes) => {
                    progresses.current[id] += bytes;
                    callbacks.onProgress?.(bytes);
                },
                onError: (err) => {
                    callbacks.onError?.(err);
                    reject(err);
                },
            });

            controls.current[id] = uploadControls;
            progresses.current[id] = 0;

            addNewUpload(id, preUploadData);

            setupPromise
                .then(() => updateUploadState(id, TransferState.Pending))
                .catch((error) => {
                    if (isTransferCancelError(error)) {
                        updateUploadState(id, TransferState.Canceled);
                    } else {
                        updateUploadState(id, TransferState.Error, { error });
                    }
                    reject(error);
                });
        });

    const getUploadsProgresses = () => ({ ...progresses.current });

    const getUploadsImmediate = () => uploadsRef.current;

    const getAbortController = () => abortRef.current;

    return (
        <UploadContext.Provider
            value={{
                uploads,
                getUploadsImmediate,
                addToUploadQueue,
                getUploadsProgresses,
                clearUploads,
                removeUpload,
                cancelUpload,
                pauseUpload,
                resumeUpload,
                getAbortController,
                getFolderConflictStrategy,
            }}
        >
            {children}
        </UploadContext.Provider>
    );
};

export const useUploadProvider = (): UploadProviderState => {
    const state = useContext(UploadContext);
    if (!state) {
        throw new Error('Trying to use uninitialized UploadProvider');
    }
    return state;
};
