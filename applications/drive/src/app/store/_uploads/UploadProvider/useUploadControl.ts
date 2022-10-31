import { useCallback, useRef } from 'react';

import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';

import { TransferProgresses, TransferState } from '../../../components/TransferManager/transfer';
import { isTransferActive, isTransferFinalizing, isTransferPending, isTransferProgress } from '../../../utils/transfer';
import { MAX_BLOCKS_PER_UPLOAD } from '../constants';
import { UploadFileControls, UploadFolderControls } from '../interface';
import { FileUpload, UpdateCallback, UpdateFilter, UpdateState } from './interface';

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
        // Progress might be updated even when transfer is already finished and
        // thus progress is not here anymore. In such case it is OK to simply
        // ignore the call to not crash.
        if (progresses.current[id] === undefined) {
            return;
        }
        progresses.current[id] += increment;
        // Because increment can be float, some aritmetic operation can result
        // in -0.0000000001 which would be then displayed as -0 after rounding.
        if (progresses.current[id] < 0) {
            progresses.current[id] = 0;
        }
    };

    const getProgresses = () => ({ ...progresses.current });

    /**
     * calculateRemainingUploadBytes returns based on progresses of ongoing
     * uploads how many data is planned to be uploaded to properly count the
     * available space for next batch of files to be uploaded.
     */
    const calculateRemainingUploadBytes = (): number => {
        return fileUploads.reduce((sum, upload) => {
            if (!isTransferActive(upload) || !upload.file.size) {
                return sum;
            }
            // uploadedChunksSize counts only fully uploaded blocks. Fully
            // uploaded blocks are counted into used space returned by API.
            // The algorithm is not precise as file is uploaded in parallel,
            // but this is what we can do without introducing complex
            // computation. If better precision is needed, we need to keep
            // track of each block, not the whole file.
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
    const calculateFileUploadLoad = (): number => {
        // Count both in-progress and finalizing transfers as the ones still
        // running the worker and taking up some load. Without counting finalizing
        // state and with the API being slow, we can keep around too many workers.
        return fileUploads
            .filter((transfer) => isTransferProgress(transfer) || isTransferFinalizing(transfer))
            .reduce((load, upload) => {
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
                ({ resumeState, parentId }) => {
                    // If the parent folder was created during the pause,
                    // go back to pending, not initializing state.
                    if (parentId && resumeState === TransferState.Initializing) {
                        return TransferState.Pending;
                    }
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
