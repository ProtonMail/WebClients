import { useCallback, useEffect, useRef } from 'react';

import { TransferCancel, TransferState } from '../../../components/TransferManager/transfer';
import { useConflictModal } from '../../../components/modals/ConflictModal';
import { waitUntil } from '../../../utils/async';
import { isTransferActive, isTransferConflict } from '../../../utils/transfer';
import { TransferConflictStrategy } from '../interface';
import type {
    ConflictStrategyHandler,
    FileUpload,
    FolderUpload,
    UpdateData,
    UpdateFilter,
    UpdateState,
} from './interface';

// Empty string is ensured to not conflict with any upload ID or folder name.
// No upload has empty ID.
const CONFLICT_STRATEGY_ALL_ID = '';

export default function useUploadConflict(
    fileUploads: FileUpload[],
    folderUploads: FolderUpload[],
    updateState: (filter: UpdateFilter, newState: UpdateState) => void,
    updateWithData: (filter: UpdateFilter, newState: UpdateState, data: UpdateData) => void,
    cancelUploads: (filter: UpdateFilter) => void
) {
    const [conflictModal, showConflictModal] = useConflictModal();

    // There should be always visible only one modal to chose conflict strategy.
    const isConflictStrategyModalOpen = useRef(false);

    // Conflict strategy is set per upload, or CONFLICT_STRATEGY_ALL_ID is used
    // to handle selection for all uploads.
    // Strategies are cleared once all uploads are finished so user is asked
    // again (consider that user could do another upload after an hour).
    const fileConflictStrategy = useRef<{ [id: string]: TransferConflictStrategy }>({});
    const folderConflictStrategy = useRef<{ [id: string]: TransferConflictStrategy }>({});

    useEffect(() => {
        // "Apply to all" should be active till the last transfer is active.
        // Once all transfers finish, user can start another minutes or hours
        // later and that means we should ask again.
        const hasNoActiveUpload = ![...fileUploads, ...folderUploads].find(isTransferActive);
        if (hasNoActiveUpload) {
            fileConflictStrategy.current = {};
            folderConflictStrategy.current = {};
        }
    }, [fileUploads, folderUploads]);

    /**
     * getConflictHandler returns handler which either returns the strategy
     * right away, or it sets the state of the upload to conflict which will
     * open ConflictModal to ask user what to do next. Handler waits till the
     * user selects the strategy, and also any other upload is not started
     * in case user applies the selection for all transfers, which might be
     * even to cancel all.
     */
    const getConflictHandler = useCallback(
        (
            conflictStrategyRef: React.MutableRefObject<{ [id: string]: TransferConflictStrategy }>,
            uploadId: string
        ): ConflictStrategyHandler => {
            return (abortSignal, originalIsDraft, originalIsFolder) => {
                const getStrategy = (): TransferConflictStrategy | undefined => {
                    return (
                        conflictStrategyRef.current[CONFLICT_STRATEGY_ALL_ID] || conflictStrategyRef.current[uploadId]
                    );
                };

                const strategy = getStrategy();
                if (strategy) {
                    return Promise.resolve(strategy);
                }
                updateWithData(uploadId, TransferState.Conflict, { originalIsDraft, originalIsFolder });

                return new Promise((resolve, reject) => {
                    waitUntil(() => !!getStrategy(), abortSignal)
                        .then(() => {
                            const strategy = getStrategy() as TransferConflictStrategy;
                            resolve(strategy);
                        })
                        .catch(() => {
                            reject(new TransferCancel({ message: 'Upload was canceled' }));
                        });
                });
            };
        },
        [updateWithData]
    );

    const getFileConflictHandler = useCallback(
        (uploadId: string) => {
            return getConflictHandler(fileConflictStrategy, uploadId);
        },
        [getConflictHandler]
    );

    const getFolderConflictHandler = useCallback(
        (uploadId: string) => {
            return getConflictHandler(folderConflictStrategy, uploadId);
        },
        [getConflictHandler]
    );

    const openConflictStrategyModal = (
        uploadId: string,
        conflictStrategyRef: React.MutableRefObject<{ [id: string]: TransferConflictStrategy }>,
        params: {
            name: string;
            isFolder?: boolean;
            originalIsDraft?: boolean;
            originalIsFolder?: boolean;
            isForPhotos?: boolean;
        }
    ) => {
        isConflictStrategyModalOpen.current = true;

        const apply = (strategy: TransferConflictStrategy, all: boolean) => {
            isConflictStrategyModalOpen.current = false;
            conflictStrategyRef.current[all ? CONFLICT_STRATEGY_ALL_ID : uploadId] = strategy;

            if (all) {
                updateState(({ state, file }) => {
                    // Update only folders for folder conflict strategy.
                    // And only files for file conflict strategy.
                    const isFolder = file === undefined;
                    if (isFolder !== (params.isFolder || false)) {
                        return false;
                    }
                    return isTransferConflict({ state });
                }, TransferState.Progress);
            } else {
                updateState(uploadId, TransferState.Progress);
            }
        };
        const cancelAll = () => {
            isConflictStrategyModalOpen.current = false;
            conflictStrategyRef.current[CONFLICT_STRATEGY_ALL_ID] = TransferConflictStrategy.Skip;
            cancelUploads(isTransferActive);
        };
        showConflictModal({ apply, cancelAll, ...params });
    };

    // Modals are openned on this one place only to not have race condition
    // issue and ensure only one modal, either for file or folder, is openned.
    useEffect(() => {
        if (isConflictStrategyModalOpen.current) {
            return;
        }

        const conflictingFolderUpload = folderUploads.find(isTransferConflict);
        if (conflictingFolderUpload) {
            openConflictStrategyModal(conflictingFolderUpload.id, folderConflictStrategy, {
                name: conflictingFolderUpload.meta.filename,
                isFolder: true,
                originalIsDraft: conflictingFolderUpload.originalIsDraft,
                originalIsFolder: conflictingFolderUpload.originalIsFolder,
            });
            return;
        }

        const conflictingFileUpload = fileUploads.find(isTransferConflict);
        if (conflictingFileUpload) {
            openConflictStrategyModal(conflictingFileUpload.id, fileConflictStrategy, {
                name: conflictingFileUpload.meta.filename,
                originalIsDraft: conflictingFileUpload.originalIsDraft,
                originalIsFolder: conflictingFileUpload.originalIsFolder,
                isForPhotos: conflictingFileUpload.isForPhotos,
            });
        }
    }, [fileUploads, folderUploads]);

    return {
        getFolderConflictHandler,
        getFileConflictHandler,
        conflictModal,
    };
}
