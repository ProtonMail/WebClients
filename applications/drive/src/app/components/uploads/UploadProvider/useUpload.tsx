import { useCallback, useEffect } from 'react';
import { c } from 'ttag';

import { useGetUser, useEventManager, useNotifications } from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { MAX_SAFE_UPLOADING_FILE_COUNT } from '../../../constants';
import useConfirm from '../../../hooks/util/useConfirm';
import { TransferCancel, TransferState } from '../../../interfaces/transfer';
import { isTransferCancelError, isTransferProgress } from '../../../utils/transfer';
import { MAX_UPLOAD_BLOCKS_LOAD, MAX_UPLOAD_FOLDER_LOAD } from '../constants';
import { UploadFileList } from '../interface';
import { UpdateFilter } from './interface';
import useUploadFile from './useUploadFile';
import useUploadFolder from './useUploadFolder';
import useUploadQueue, { convertFilterToFunction } from './useUploadQueue';
import useUploadConflict from './useUploadConflict';
import useUploadControl from './useUploadControl';

export default function useUpload() {
    const getUser = useGetUser();
    const { call } = useEventManager();
    const { openConfirmModal } = useConfirm();
    const { createNotification } = useNotifications();

    const {
        fileUploads,
        folderUploads,
        allUploads,
        hasUploads,
        nextFileUpload,
        nextFolderUpload,
        add: addToTheQueue,
        updateState,
        updateWithData,
        updateWithCallback,
        remove: removeFromQueue,
        clear: clearQueue,
    } = useUploadQueue();
    const {
        add: addControl,
        remove: deleteControl,
        updateProgress,
        calculateRemainingUploadBytes,
        calculateFileUploadLoad,
        pauseUploads,
        resumeUploads,
        cancelUploads,
        removeUploads,
        clearUploads,
        getProgresses,
    } = useUploadControl(fileUploads, updateWithCallback, removeFromQueue, clearQueue);
    const { getFolderConflictHandler, getFileConflictHandler } = useUploadConflict(
        fileUploads,
        folderUploads,
        updateState,
        updateWithData,
        cancelUploads
    );
    const { initFileUpload } = useUploadFile();
    const { initFolderUpload } = useUploadFolder();

    const checkHasEnoughSpace = async (files: UploadFileList) => {
        const totalFileListSize = files.reduce((sum, { file }) => sum + (file?.size || 0), 0);
        const remaining = calculateRemainingUploadBytes();
        await call(); // Process events to get updated UsedSpace.
        const { MaxSpace, UsedSpace } = await getUser();
        const hasEnoughSpace = MaxSpace > UsedSpace + remaining + totalFileListSize;
        return { hasEnoughSpace, total: totalFileListSize };
    };

    const showNotEnoughSpaceNotification = (total: number) => {
        const formattedTotal = humanSize(total);
        createNotification({
            text: c('Notification').t`Not enough space to upload ${formattedTotal}`,
            type: 'error',
        });
    };

    /**
     * uploadFiles should be considered as main entry point for uploading files
     * in Drive app. It does all necessary checks, such as the space, the
     * number of files, and it adds files to the queue. User is notified if
     * there is any issue adding files to the queue.
     */
    const uploadFiles = async (shareId: string, parentId: string, list: UploadFileList) => {
        const { hasEnoughSpace, total } = await checkHasEnoughSpace(list);
        if (!hasEnoughSpace) {
            showNotEnoughSpaceNotification(total);
            return;
        }

        const fileCount = list.length;
        if (fileCount >= MAX_SAFE_UPLOADING_FILE_COUNT) {
            await new Promise<void>((resolve, reject) => {
                openConfirmModal({
                    canUndo: true,
                    title: c('Title').t`Warning`,
                    confirm: c('Action').t`Continue`,
                    message: c('Info').t`Uploading hundreds of files at once may have a performance impact.`,
                    onConfirm: resolve,
                    onCancel: () =>
                        reject(new TransferCancel({ message: `Upload of ${fileCount} files was canceled` })),
                });
            });
        }

        try {
            addToTheQueue(shareId, parentId, list);
        } catch (err: any) {
            if ((err as Error).name === 'UploadUserError') {
                createNotification({
                    text: err.message,
                    type: 'error',
                });
            } else {
                createNotification({
                    text: c('Notification').t`Failed to upload files: ${err}`,
                    type: 'error',
                });
                throw err;
            }
        }
    };

    /**
     * uploadFile is helper to upload only one file directly.
     */
    const uploadFile = async (shareId: string, parentId: string, file: File) => {
        return uploadFiles(shareId, parentId, [{ path: [], file }]);
    };

    const restartUploads = useCallback(
        async (idOrFilter: UpdateFilter) => {
            const uploadFileList = fileUploads
                .filter(convertFilterToFunction(idOrFilter))
                .map(({ file }) => ({ path: [], file }));
            const { hasEnoughSpace, total } = await checkHasEnoughSpace(uploadFileList);
            if (!hasEnoughSpace) {
                showNotEnoughSpaceNotification(total);
                return;
            }
            updateState(idOrFilter, ({ parentId }) => {
                return parentId ? TransferState.Pending : TransferState.Initializing;
            });
        },
        [fileUploads, updateState]
    );

    // Effect to start next folder upload if there is enough capacity to do so.
    useEffect(() => {
        if (!nextFolderUpload) {
            return;
        }

        const folderLoad = folderUploads.filter(isTransferProgress).length;
        if (folderLoad > MAX_UPLOAD_FOLDER_LOAD) {
            return;
        }

        // Set progress right away to not start the folder more than once.
        updateState(nextFolderUpload.id, TransferState.Progress);

        const controls = initFolderUpload(
            nextFolderUpload.shareId,
            nextFolderUpload.parentId,
            nextFolderUpload.name,
            getFolderConflictHandler(nextFolderUpload.id)
        );
        addControl(nextFolderUpload.id, controls);
        controls
            .start()
            .then(({ folderId }) => {
                updateWithData(nextFolderUpload.id, TransferState.Done, { folderId });
            })
            .catch((error) => {
                if (isTransferCancelError(error)) {
                    updateState(nextFolderUpload.id, TransferState.Canceled);
                } else {
                    updateWithData(nextFolderUpload.id, TransferState.Error, { error });
                }
            })
            .finally(() => {
                deleteControl(nextFolderUpload.id);
            });
    }, [nextFolderUpload, folderUploads]);

    // Effect to start next file upload if there is enough capacity to do so.
    useEffect(() => {
        if (!nextFileUpload) {
            return;
        }

        const fileLoad = calculateFileUploadLoad();
        if (fileLoad > MAX_UPLOAD_BLOCKS_LOAD) {
            return;
        }

        // Set progress right away to not start the file more than once.
        updateState(nextFileUpload.id, TransferState.Progress);

        const controls = initFileUpload(
            nextFileUpload.shareId,
            nextFileUpload.parentId,
            nextFileUpload.file,
            getFileConflictHandler(nextFileUpload.id)
        );
        addControl(nextFileUpload.id, controls);
        controls
            .start({
                onInit: (mimeType: string, fileName: string) => {
                    updateWithData(nextFileUpload.id, TransferState.Progress, { mimeType, name: fileName });
                },
                onProgress: (increment: number) => {
                    updateProgress(nextFileUpload.id, increment);
                },
                onFinalize: () => {
                    updateState(nextFileUpload.id, TransferState.Finalizing);
                },
            })
            .then(() => {
                updateState(nextFileUpload.id, TransferState.Done);
            })
            .catch((error) => {
                if (isTransferCancelError(error)) {
                    updateState(nextFileUpload.id, TransferState.Canceled);
                } else {
                    updateWithData(nextFileUpload.id, TransferState.Error, { error });
                }
            })
            .finally(() => {
                deleteControl(nextFileUpload.id);
            });
    }, [
        nextFileUpload,
        // calculateFileUploadLoad can give different result every time,
        // therefore we want to run this effect more often, but not every
        // single time. I think dependency to allUploads is good compromise.
        allUploads,
    ]);

    return {
        fileUploads,
        hasUploads,
        uploadFile,
        uploadFiles,
        getProgresses,
        pauseUploads,
        resumeUploads,
        cancelUploads,
        restartUploads,
        removeUploads,
        clearUploads,
    };
}
