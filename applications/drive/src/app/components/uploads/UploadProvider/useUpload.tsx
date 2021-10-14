import { useCallback, useEffect } from 'react';
import { c } from 'ttag';

import { useGetUser, useEventManager, useNotifications, usePreventLeave } from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { MAX_SAFE_UPLOADING_FILE_COUNT } from '@proton/shared/lib/drive/constants';
import { TransferCancel, TransferState } from '@proton/shared/lib/interfaces/drive/transfer';

import useConfirm from '../../../hooks/util/useConfirm';
import { isTransferCancelError, isTransferProgress } from '../../../utils/transfer';
import { MAX_UPLOAD_BLOCKS_LOAD, MAX_UPLOAD_FOLDER_LOAD } from '../constants';
import { UploadFileList, UploadFileItem } from '../interface';
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
    const { preventLeave } = usePreventLeave();

    const queue = useUploadQueue();
    const control = useUploadControl(queue.fileUploads, queue.updateWithCallback, queue.remove, queue.clear);
    const { getFolderConflictHandler, getFileConflictHandler } = useUploadConflict(
        queue.fileUploads,
        queue.folderUploads,
        queue.updateState,
        queue.updateWithData,
        control.cancelUploads
    );
    const { initFileUpload } = useUploadFile();
    const { initFolderUpload } = useUploadFolder();

    const checkHasEnoughSpace = async (files: UploadFileList) => {
        const totalFileListSize = files.reduce((sum, item) => sum + ((item as UploadFileItem).file?.size || 0), 0);
        const remaining = control.calculateRemainingUploadBytes();
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

        await queue.add(shareId, parentId, list).catch((err: any) => {
            const errors = Array.isArray(err) ? err : [err];
            errors.forEach((err) => {
                if ((err as Error).name === 'UploadUserError' || (err as Error).name === 'UploadConflictError') {
                    createNotification({
                        text: err.message,
                        type: 'error',
                    });
                } else {
                    createNotification({
                        text: c('Notification').t`Failed to upload files: ${err}`,
                        type: 'error',
                    });
                    console.error(err);
                }
            });
        });
    };

    const restartUploads = useCallback(
        async (idOrFilter: UpdateFilter) => {
            const uploadFileList = queue.fileUploads
                .filter(convertFilterToFunction(idOrFilter))
                .map(({ file }) => ({ path: [], file }));
            const { hasEnoughSpace, total } = await checkHasEnoughSpace(uploadFileList);
            if (!hasEnoughSpace) {
                showNotEnoughSpaceNotification(total);
                return;
            }
            queue.updateState(idOrFilter, ({ parentId }) => {
                return parentId ? TransferState.Pending : TransferState.Initializing;
            });
        },
        [queue.fileUploads, queue.updateState]
    );

    // Effect to start next folder upload if there is enough capacity to do so.
    useEffect(() => {
        const { nextFolderUpload } = queue;
        if (!nextFolderUpload) {
            return;
        }

        const folderLoad = queue.folderUploads.filter(isTransferProgress).length;
        if (folderLoad > MAX_UPLOAD_FOLDER_LOAD) {
            return;
        }

        // Set progress right away to not start the folder more than once.
        queue.updateState(nextFolderUpload.id, TransferState.Progress);

        const controls = initFolderUpload(
            nextFolderUpload.shareId,
            nextFolderUpload.parentId,
            nextFolderUpload.name,
            nextFolderUpload.modificationTime,
            getFolderConflictHandler(nextFolderUpload.id)
        );
        control.add(nextFolderUpload.id, controls);
        void preventLeave(
            controls
                .start()
                .then(({ folderId }) => {
                    queue.updateWithData(nextFolderUpload.id, TransferState.Done, { folderId });
                })
                .catch((error) => {
                    if (isTransferCancelError(error)) {
                        queue.updateState(nextFolderUpload.id, TransferState.Canceled);
                    } else {
                        queue.updateWithData(nextFolderUpload.id, TransferState.Error, { error });
                    }
                })
                .finally(() => {
                    control.remove(nextFolderUpload.id);
                })
        );
    }, [queue.nextFolderUpload, queue.folderUploads]);

    // Effect to start next file upload if there is enough capacity to do so.
    useEffect(() => {
        const { nextFileUpload } = queue;
        if (!nextFileUpload) {
            return;
        }

        const fileLoad = control.calculateFileUploadLoad();
        if (fileLoad > MAX_UPLOAD_BLOCKS_LOAD) {
            return;
        }

        // Set progress right away to not start the file more than once.
        queue.updateState(nextFileUpload.id, TransferState.Progress);

        const controls = initFileUpload(
            nextFileUpload.shareId,
            nextFileUpload.parentId,
            nextFileUpload.file,
            getFileConflictHandler(nextFileUpload.id)
        );
        control.add(nextFileUpload.id, controls);
        void preventLeave(
            controls
                .start({
                    onInit: (mimeType: string, fileName: string) => {
                        // Keep the previous state for cases when the upload is paused.
                        queue.updateWithData(nextFileUpload.id, ({ state }) => state, { mimeType, name: fileName });
                    },
                    onProgress: (increment: number) => {
                        control.updateProgress(nextFileUpload.id, increment);
                    },
                    onFinalize: () => {
                        queue.updateState(nextFileUpload.id, TransferState.Finalizing);
                    },
                })
                .then(() => {
                    queue.updateState(nextFileUpload.id, TransferState.Done);
                })
                .catch((error) => {
                    if (isTransferCancelError(error)) {
                        queue.updateState(nextFileUpload.id, TransferState.Canceled);
                    } else {
                        queue.updateWithData(nextFileUpload.id, TransferState.Error, { error });
                    }
                })
                .finally(() => {
                    control.remove(nextFileUpload.id);
                })
        );
    }, [
        queue.nextFileUpload,
        // calculateFileUploadLoad gives different result every time, but we
        // don't want to use it as a dependency to not run this effect too
        // often (every time). Dependency to allUploads is a good compromise.
        queue.allUploads,
    ]);

    return {
        fileUploads: queue.fileUploads,
        hasUploads: queue.hasUploads,
        uploadFiles,
        getProgresses: control.getProgresses,
        pauseUploads: control.pauseUploads,
        resumeUploads: control.resumeUploads,
        cancelUploads: control.cancelUploads,
        restartUploads,
        removeUploads: control.removeUploads,
        clearUploads: control.clearUploads,
    };
}
