import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { initUpload, UploadControls, UploadCallbacks } from './upload';
import { TransferState, TransferProgresses, Upload, PreUploadData } from '../../interfaces/transfer';
import {
    isTransferProgress,
    isTransferPending,
    isTransferFailed,
    isTransferCancelError,
    isTransferPaused,
    isTransferFinished,
} from '../../utils/transfer';

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
}

const MAX_ACTIVE_UPLOADS = 3;

const UploadContext = createContext<UploadProviderState | null>(null);

interface UserProviderProps {
    children: React.ReactNode;
}

export const UploadProvider = ({ children }: UserProviderProps) => {
    // Keeping ref in case we need to immediately get uploads without waiting for rerender
    const uploadsRef = useRef<Upload[]>([]);
    const [uploads, setUploads] = useState<Upload[]>([]);
    const controls = useRef<{ [id: string]: UploadControls }>({});
    const progresses = useRef<TransferProgresses>({});
    const abortRef = useRef(new AbortController());

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

    useEffect(() => {
        const uploadingOrReady = uploads.filter(
            (upload) => isTransferProgress(upload) || (isTransferPending(upload) && upload.ready)
        );
        const nextQueued = uploads.find((upload) => isTransferPending(upload) && !upload.ready);

        if (uploadingOrReady.length < MAX_ACTIVE_UPLOADS && nextQueued) {
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
                    if (isTransferCancelError(error)) {
                        updateUploadState(id, TransferState.Canceled);
                    } else {
                        console.error(`Upload ${id} failed: ${error}`);
                        updateUploadState(id, TransferState.Error, { error });
                    }
                });
        }
    }, [uploads]);

    const addToUploadQueue = async (
        preUploadData: PreUploadData,
        setupPromise: Promise<any>,
        callbacks: UploadCallbacks
    ) =>
        new Promise<void>((resolve, reject) => {
            const { id, uploadControls } = initUpload(preUploadData.file, {
                ...callbacks,
                initialize: async (abortSignal) => {
                    const result = await callbacks.initialize(abortSignal);
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
                    updateUploadState(id, TransferState.Error, { error });
                    reject(error);
                });
        });

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
