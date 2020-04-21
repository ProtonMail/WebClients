import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { initUpload, UploadCallbacks, UploadControls } from './upload';
import { TransferState, TransferProgresses, TransferMeta } from '../../interfaces/transfer';

export interface BlockMeta {
    Index: number;
    Hash: string;
    Token: string;
}

export interface UploadInfo {
    blob: Blob;
    LinkID: string;
    ShareID: string;
    RevisionID: string;
    ParentLinkID: string;
}

export interface Upload {
    id: string;
    meta: TransferMeta;
    info?: UploadInfo;
    state: TransferState;
    startDate: Date;
}

interface UploadProviderState {
    uploads: Upload[];
    addToUploadQueue: (
        file: File,
        metadataPromise: Promise<{ meta: TransferMeta; info: UploadInfo }>,
        callbacks: UploadCallbacks
    ) => void;
    getUploadsProgresses: () => TransferProgresses;
    getUploadsImmediate: () => Upload[];
    clearUploads: () => void;
}

const MAX_ACTIVE_UPLOADS = 3;

const UploadContext = createContext<UploadProviderState | null>(null);

interface UserProviderProps {
    children: React.ReactNode;
}

export const UploadProvider = ({ children }: UserProviderProps) => {
    // Keeping ref in case we need to immediatelly get uploads without waiting for rerender
    const uploadsRef = useRef<Upload[]>([]);
    const [uploads, setUploads] = useState<Upload[]>([]);
    const controls = useRef<{ [id: string]: UploadControls }>({});
    const progresses = useRef<TransferProgresses>({});

    const updateUploadByID = (id: string, data: Partial<Upload>) => {
        uploadsRef.current = uploadsRef.current.map((upload) => (upload.id === id ? { ...upload, ...data } : upload));
        setUploads(uploadsRef.current);
    };

    const addNewUpload = (id: string, file: File) => {
        uploadsRef.current = [
            ...uploadsRef.current,
            {
                id,
                meta: {
                    filename: file.name,
                    mimeType: file.type,
                    size: file.size
                },
                state: TransferState.Initializing,
                startDate: new Date()
            }
        ];
        setUploads(uploadsRef.current);
    };

    const clearUploads = () => {
        // TODO: cancel pending downloads when implementing reject
        uploadsRef.current = [];
        setUploads(uploadsRef.current);
    };

    const updateUploadState = (id: string, state: TransferState) => updateUploadByID(id, { state });

    useEffect(() => {
        const activeUploads = uploads.filter(({ state }) => state === TransferState.Progress);
        const nextPending = uploads.find(({ state }) => state === TransferState.Pending);

        if (activeUploads.length < MAX_ACTIVE_UPLOADS && nextPending) {
            const { id, info } = nextPending;

            if (!info) {
                // Should never happen really
                console.error('Pending upload has no upload info');
                updateUploadState(id, TransferState.Error);
                return;
            }

            updateUploadState(id, TransferState.Progress);

            controls.current[id]
                .start(info)
                .then(() => {
                    // Update upload progress to 100%
                    const upload = uploads.find((upload) => upload.id === id);
                    if (upload) {
                        progresses.current[id] = upload.meta.size;
                    }
                    updateUploadState(id, TransferState.Done);
                })
                .catch((err) => {
                    console.error(err);
                    updateUploadState(id, TransferState.Error);
                });
        }
    }, [uploads]);

    const addToUploadQueue = async (
        file: File,
        metadataPromise: Promise<{ meta: TransferMeta; info: UploadInfo }>,
        callbacks: UploadCallbacks
    ) => {
        const { id, uploadControls } = initUpload({
            ...callbacks,
            onProgress: (bytes) => {
                progresses.current[id] += bytes;
                callbacks.onProgress?.(bytes);
            }
        });

        controls.current[id] = uploadControls;
        progresses.current[id] = 0;

        addNewUpload(id, file);

        const { meta, info } = await metadataPromise.catch((err) => {
            updateUploadState(id, TransferState.Error);
            throw err;
        });

        updateUploadByID(id, {
            meta,
            info,
            state: TransferState.Pending
        });
    };

    const getUploadsProgresses = () => ({ ...progresses.current });

    const getUploadsImmediate = () => {
        return uploadsRef.current;
    };

    return (
        <UploadContext.Provider
            value={{
                uploads,
                getUploadsImmediate,
                addToUploadQueue,
                getUploadsProgresses,
                clearUploads
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
