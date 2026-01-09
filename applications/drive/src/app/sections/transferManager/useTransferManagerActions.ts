import { useCallback } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useConfirmActionModal } from '@proton/components';
import { splitNodeUid } from '@proton/drive/index';
import { uploadManager, useUploadQueueStore } from '@proton/drive/modules/upload';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { DownloadManager } from '../../managers/download/DownloadManager';
import { useSharingModal } from '../../modals/SharingModal/SharingModal';
import { BaseTransferStatus, IssueStatus, useDownloadManagerStore } from '../../zustand/download/downloadManager.store';
import type { TransferManagerEntry } from './useTransferManagerState';

export const useTransferManagerActions = () => {
    const downloadManager = DownloadManager.getInstance();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [sharingModal, showSharingModal] = useSharingModal();
    const { getUploadItem } = useUploadQueueStore(useShallow((state) => ({ getUploadItem: state.getItem })));
    const { clearDownloads, updateDownloadItem, getDownloadItem } = useDownloadManagerStore(
        useShallow((state) => {
            return {
                clearDownloads: state.clearQueue,
                updateDownloadItem: state.updateDownloadItem,
                getDownloadItem: state.getQueueItem,
            };
        })
    );
    const { clearUploads } = useUploadQueueStore(
        useShallow((state) => {
            return {
                clearUploads: state.clearQueue,
            };
        })
    );

    const clearQueue = () => {
        clearDownloads();
        clearUploads();
    };

    const cancelTransfer = useCallback(
        (entry: TransferManagerEntry) => {
            if (entry.type === 'download') {
                downloadManager.cancel([entry.id]);
            }
            if (entry.type === 'upload') {
                void uploadManager.cancelUpload(entry.id);
            }
        },
        [downloadManager]
    );

    const retryTransfer = (entry: TransferManagerEntry) => {
        if (entry.type === 'download') {
            const item = getDownloadItem(entry.id);
            if (item?.unsupportedFileDetected) {
                updateDownloadItem(entry.id, { unsupportedFileDetected: IssueStatus.Detected });
            }
            downloadManager.retry([entry.id]);
        }
        if (entry.type === 'upload') {
            uploadManager.retryUpload(entry.id);
        }
    };

    const cancelAll = (entries: TransferManagerEntry[]) => {
        const title = c('Title').t`Cancel all uploads?`;
        const message = c('Info')
            .t`This will cancel any remaining uploads. Cancelled files won't be saved in ${DRIVE_APP_NAME}.`;
        const submitText = c('Action').t`Cancel uploads`;
        const cancelText = c('Action').t`Go back`;

        void showConfirmModal({
            title,
            submitText,
            cancelText,
            message,
            canUndo: true,
            // needs to be async because that's required by ConfirmModal.onSubmit
            onSubmit: async () => {
                for (const entry of entries) {
                    if (entry.status === BaseTransferStatus.InProgress || entry.status === BaseTransferStatus.Pending) {
                        cancelTransfer(entry);
                    }
                }
            },
        });
    };

    const share = async (
        entry: TransferManagerEntry,
        /** @deprecated: Should be removed once everything is migrated to sdk */
        deprecatedShareId: string
    ) => {
        const uploadedItem = getUploadItem(entry.id);
        if (uploadedItem && uploadedItem.nodeUid) {
            const { nodeId, volumeId } = splitNodeUid(uploadedItem.nodeUid);
            showSharingModal({
                volumeId: volumeId,
                linkId: nodeId,
                shareId: deprecatedShareId,
            });
        }
    };

    const retryFailedTransfers = (entries: TransferManagerEntry[]) => {
        for (const entry of entries) {
            if (entry.status === BaseTransferStatus.Failed) {
                retryTransfer(entry);
            }
        }
    };

    return {
        clearQueue,
        cancelTransfer,
        retryTransfer,
        share,
        cancelAll,
        confirmModal,
        sharingModal,
        retryFailedTransfers,
    };
};
