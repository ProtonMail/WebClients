import { useCallback, useRef } from 'react';

import { FILE_CHUNK_SIZE } from '../../../constants';
import { TransferState, TransferProgresses } from '../../../interfaces/transfer';
import { isTransferProgress, isTransferPending, isTransferOngoing } from '../../../utils/transfer';
import { MAX_BLOCKS_PER_UPLOAD } from '../constants';
import { UploadFileControls, UploadFolderControls } from '../interface';
import { FileUpload, UpdateFilter, UpdateState, UpdateCallback } from './interface';

export default function useUploadControl(
    fileUploads: FileUpload[],
    updateWithCallback: (idOrFilter: UpdateFilter, newState: UpdateState, callback: UpdateCallback) => void,
    removeFromQueue: (idOrFilter: UpdateFilter, callback: UpdateCallback) => void,
    clearQueue: () => void
) {
    // Controls keep references to ongoing uploads to have ability
    // to pause or cancel them.
    const controls = useRef<{ [id: string]: UploadFileControls | UploadFolderControls }>({});
    const progresses = useRef<TransferProgresses>({});

    const add = (id: string, uploadControls: UploadFileControls | UploadFolderControls) => {
        controls.current[id] = uploadControls;
        progresses.current[id] = 0;
    };

    const remove = (id: string) => {
        delete controls.current[id];
        delete progresses.current[id];
    };

    const updateProgress = (id: string, increment: number) => {
        progresses.current[id] += increment;
    };

    const getProgresses = () => ({ ...progresses.current });

    /**
     * calculateRemainingUploadBytes returns based on progresses of ongoing
     * uploads how many data is planned to be uploaded to properly count the
     * available space for next batch of files to be uploaded.
     */
    const calculateRemainingUploadBytes = () => {
        return fileUploads.reduce((sum, upload) => {
            if (!isTransferOngoing(upload) || !upload.file.size) {
                return sum;
            }
            const uploadedChunksSize =
                progresses.current[upload.id] - (progresses.current[upload.id] % FILE_CHUNK_SIZE) || 0;
            return sum + upload.file.size - uploadedChunksSize;
        }, 0);
    };

    /**
     * calculateFileUploadLoad returns how many blocks are being currently
     * uploaded by all ongoing uploads, considering into account the real
     * state using the progresses.
     */
    const calculateFileUploadLoad = () => {
        return fileUploads.filter(isTransferProgress).reduce((load, upload) => {
            const remainingSize = (upload.file.size || 0) - (progresses.current[upload.id] || 0);
            // Even if the file is empty, keep the minimum of blocks to 1,
            // otherwise it would start too many threads.
            const chunks = Math.max(Math.ceil(remainingSize / FILE_CHUNK_SIZE), 1);
            const loadIncrease = Math.min(MAX_BLOCKS_PER_UPLOAD, chunks);
            return load + loadIncrease;
        }, 0);
    };

    const pauseUploads = useCallback(
        (idOrFilter: UpdateFilter) => {
            updateWithCallback(idOrFilter, TransferState.Paused, ({ id, state }) => {
                if (isTransferProgress({ state }) || isTransferPending({ state })) {
                    (controls.current[id] as UploadFileControls)?.pause?.();
                }
            });
        },
        [updateWithCallback]
    );

    const resumeUploads = useCallback(
        (idOrFilter: UpdateFilter) => {
            updateWithCallback(
                idOrFilter,
                ({ resumeState }) => {
                    return resumeState || TransferState.Progress;
                },
                ({ id }) => {
                    (controls.current[id] as UploadFileControls)?.resume?.();
                }
            );
        },
        [updateWithCallback]
    );

    const cancelUploads = useCallback(
        (idOrFilter: UpdateFilter) => {
            updateWithCallback(idOrFilter, TransferState.Canceled, ({ id }) => {
                controls.current[id]?.cancel();
            });
        },
        [updateWithCallback]
    );

    const removeUploads = useCallback(
        (idOrFilter: UpdateFilter) => {
            // We should never simply remove uploads, but cancel it first, so
            // it does not continue on background without our knowledge.
            cancelUploads(idOrFilter);
            removeFromQueue(idOrFilter, ({ id }) => remove(id));
        },
        [removeFromQueue]
    );

    const clearUploads = useCallback(() => {
        Object.entries(controls.current).map(([, uploadControls]) => uploadControls.cancel());
        controls.current = {};
        progresses.current = {};
        clearQueue();
    }, [clearQueue]);

    return {
        add,
        remove,
        updateProgress,
        getProgresses,
        calculateRemainingUploadBytes,
        calculateFileUploadLoad,
        pauseUploads,
        resumeUploads,
        cancelUploads,
        removeUploads,
        clearUploads,
    };
}
