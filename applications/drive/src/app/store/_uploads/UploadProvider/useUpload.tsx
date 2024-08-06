import { useCallback, useEffect } from 'react';

import { c } from 'ttag';

import { useEventManager, useGetUser, useNotifications, useOnline, usePreventLeave, useUser } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { MAX_SAFE_UPLOADING_FILE_COUNT, MAX_SAFE_UPLOADING_FILE_SIZE } from '@proton/shared/lib/drive/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getAppSpace, getSpace } from '@proton/shared/lib/user/storage';

import { TransferCancel, TransferState } from '../../../components/TransferManager/transfer';
import type { FileThresholdModalType } from '../../../components/modals/FileThresholdModal';
import { useFileThresholdModal } from '../../../components/modals/FileThresholdModal';
import { sendErrorReport } from '../../../utils/errorHandling';
import {
    isPhotosDisabledUploadError,
    isTransferCancelError,
    isTransferOngoing,
    isTransferPausedByConnection,
    isTransferProgress,
    isTransferRetry,
    isTransferSkipError,
} from '../../../utils/transfer';
import { useDirectSharingInfo } from '../../_shares/useDirectSharingInfo';
import { useTransferLog } from '../../_transfer';
import { MAX_UPLOAD_BLOCKS_LOAD, MAX_UPLOAD_FOLDER_LOAD } from '../constants';
import type { UploadFileItem, UploadFileList } from '../interface';
import type { UploadModalContainer } from './UploadModalContainer';
import type { UploadProviderState } from './UploadProviderState';
import type { UpdateFilter } from './interface';
import useUploadConflict from './useUploadConflict';
import useUploadControl from './useUploadControl';
import useUploadFile from './useUploadFile';
import useUploadFolder from './useUploadFolder';
import useUploadMetrics, { getFailedUploadMetadata } from './useUploadMetrics';
import useUploadQueue, { convertFilterToFunction } from './useUploadQueue';

export default function useUpload(): [UploadProviderState, UploadModalContainer] {
    const onlineStatus = useOnline();
    const getUser = useGetUser();
    const [user] = useUser();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { preventLeave } = usePreventLeave();
    const { isSharedWithMe: getIsSharedWithMe } = useDirectSharingInfo();

    const metrics = useUploadMetrics(user.isPaid);
    const { log, downloadLogs, clearLogs } = useTransferLog('upload');
    const queue = useUploadQueue((id, message) => log(id, `queue: ${message}`));
    const control = useUploadControl(queue.fileUploads, queue.updateWithCallback, queue.remove, queue.clear);
    const { getFolderConflictHandler, getFileConflictHandler, conflictModal } = useUploadConflict(
        queue.fileUploads,
        queue.folderUploads,
        queue.updateState,
        queue.updateWithData,
        control.cancelUploads
    );
    const { initFileUpload } = useUploadFile();
    const { initFolderUpload } = useUploadFolder();

    const [fileThresholdModal, showFileThresholdModal] = useFileThresholdModal();

    const getTotalFileList = (files: UploadFileList) => {
        const totalFileListSize = files.reduce((sum, item) => sum + ((item as UploadFileItem).file?.size || 0), 0);
        return totalFileListSize;
    };

    const checkHasEnoughSpace = async (totalFileListSize: number) => {
        const remaining = control.calculateRemainingUploadBytes();
        await call(); // Process events to get updated UsedSpace.
        const user = await getUser();
        const space = getAppSpace(getSpace(user), APPS.PROTONDRIVE);
        const hasEnoughSpace = space.maxSpace > space.usedSpace + remaining + totalFileListSize;
        return hasEnoughSpace;
    };

    const showNotEnoughSpaceNotification = (total: number) => {
        const formattedTotal = humanSize({ bytes: total });
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
    const uploadFiles = async (
        shareId: string,
        parentId: string,
        list: UploadFileList,
        isForPhotos: boolean = false
    ) => {
        const total = getTotalFileList(list);
        // We check if item is upload into a shared with me share as we don't check for space on external volumes
        const isSharedWithMe = await getIsSharedWithMe(new AbortController().signal, shareId);
        const hasEnoughSpace = isSharedWithMe || (await checkHasEnoughSpace(total));
        if (!hasEnoughSpace) {
            showNotEnoughSpaceNotification(total);
            return;
        }

        const fileCount = list.length;

        let fileThresholdModalType: FileThresholdModalType | undefined;
        if (total >= MAX_SAFE_UPLOADING_FILE_SIZE) {
            fileThresholdModalType = 'fileSizeTotal';
        }
        if (fileCount >= MAX_SAFE_UPLOADING_FILE_COUNT) {
            fileThresholdModalType = 'fileNumberTotal';
        }
        if (fileThresholdModalType) {
            await new Promise<void>((resolve, reject) => {
                void showFileThresholdModal({
                    type: fileThresholdModalType,
                    onSubmit: () => {
                        resolve();
                    },
                    onCancel: () =>
                        reject(new TransferCancel({ message: `Upload of ${fileCount} files was canceled` })),
                });
            });
        }

        await queue.add(shareId, parentId, list, isForPhotos, isSharedWithMe).catch((err: any) => {
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
                // TODO: We ignore shared with me items from list as they are not part of user storage
                .filter((item) => !item.isSharedWithMe && convertFilterToFunction(idOrFilter))
                .map(({ file, isSharedWithMe }) => ({ path: [], file, isSharedWithMe }));
            const total = getTotalFileList(uploadFileList);
            const hasEnoughSpace = await checkHasEnoughSpace(total);
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
            getFolderConflictHandler(nextFolderUpload.id),
            (message: string) => log(nextFolderUpload.id, `folderUploader: ${message}`)
        );
        control.add(nextFolderUpload.id, controls);
        void preventLeave(
            controls
                .start()
                .then(({ folderId, folderName }) => {
                    queue.updateWithData(nextFolderUpload.id, TransferState.Done, { folderId, name: folderName });
                })
                .catch((error) => {
                    if (isTransferCancelError(error)) {
                        queue.updateState(nextFolderUpload.id, TransferState.Canceled);
                    } else {
                        queue.updateWithData(nextFolderUpload.id, TransferState.Error, { error });
                        sendErrorReport(error);
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
            getFileConflictHandler(nextFileUpload.id),
            (message: string) => log(nextFileUpload.id, `fileUploader: ${message}`),
            nextFileUpload.isForPhotos
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
                        log(nextFileUpload.id, `progress: Uploaded ${increment} bytes`);
                    },
                    onNetworkError: (error: any) => {
                        queue.updateWithData(nextFileUpload.id, TransferState.NetworkError, { error });
                    },
                    onFinalize: () => {
                        queue.updateState(nextFileUpload.id, TransferState.Finalizing);
                    },
                })
                .then(() => {
                    queue.updateState(nextFileUpload.id, TransferState.Done);
                    metrics.uploadSucceeded(nextFileUpload.shareId, nextFileUpload.numberOfErrors);
                })
                .catch((error) => {
                    if (isPhotosDisabledUploadError(error)) {
                        queue.updateWithData((params) => !!params.isForPhotos, TransferState.Error, { error });
                    } else if (isTransferCancelError(error)) {
                        queue.updateState(nextFileUpload.id, TransferState.Canceled);
                    } else if (isTransferRetry(error)) {
                        queue.updateState(nextFileUpload.id, ({ parentId }) =>
                            parentId ? TransferState.Pending : TransferState.Initializing
                        );
                    } else if (isTransferSkipError(error)) {
                        queue.updateWithData(nextFileUpload.id, TransferState.Skipped, { error });
                    } else {
                        queue.updateWithData(nextFileUpload.id, TransferState.Error, { error });
                        sendErrorReport(error);
                        metrics.uploadFailed(getFailedUploadMetadata(nextFileUpload, control.getProgresses()), error);
                    }

                    // If the error is 429 (rate limited), we should not continue
                    // with other uploads in the queue and fail fast, otherwise
                    // it just triggers more strict jails and leads to nowhere.
                    if (
                        error?.status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS ||
                        error?.statusCode === HTTP_ERROR_CODES.TOO_MANY_REQUESTS
                    ) {
                        log(nextFileUpload.id, `Got 429, canceling ongoing uploads`);
                        control.cancelUploads(isTransferOngoing);
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

    useEffect(() => {
        if (onlineStatus) {
            const ids = queue.allUploads.filter(isTransferPausedByConnection).map(({ id }) => id);
            control.resumeUploads(({ id }) => ids.includes(id));
        }
    }, [onlineStatus]);

    return [
        {
            uploads: queue.allUploads,
            hasUploads: queue.hasUploads,
            uploadFiles,
            getUploadsProgresses: control.getProgresses,
            pauseUploads: control.pauseUploads,
            resumeUploads: control.resumeUploads,
            cancelUploads: control.cancelUploads,
            restartUploads,
            removeUploads: control.removeUploads,
            clearUploads: () => {
                control.clearUploads();
                clearLogs();
            },
            downloadUploadLogs: downloadLogs,
        },
        {
            fileThresholdModal,
            conflictModal,
        },
    ];
}
