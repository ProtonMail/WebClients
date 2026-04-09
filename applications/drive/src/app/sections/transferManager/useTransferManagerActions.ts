import { useCallback } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useConfirmActionModal } from '@proton/components';
import { getDrivePerNodeType } from '@proton/drive';
import { uploadManager, useUploadQueueStore } from '@proton/drive/modules/upload';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { useDownloadContainsDocumentsModal } from '../../components/modals/DownloadContainsDocumentsModal';
import { DownloadManager } from '../../managers/download/DownloadManager';
import { useSharingModal } from '../../modals/SharingModal/SharingModal';
import { useSignatureIssueModal } from '../../modals/SignatureIssueModal';
import { IssueStatus, useDownloadManagerStore } from '../../zustand/download/downloadManager.store';
import { isCancellable, isRetryable } from './transferStatus';
import type { TransferManagerEntry } from './useTransferManagerState';

export const useTransferManagerActions = () => {
    const downloadManager = DownloadManager.getInstance();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { sharingModal, showSharingModal } = useSharingModal();
    const [containsDocumentModal, showDocumentsModal] = useDownloadContainsDocumentsModal();
    const { signatureIssueModal, showSignatureIssueModal } = useSignatureIssueModal();
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
                void downloadManager.cancel([entry.id]);
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
        const cancellableEntries = entries.filter(isCancellable);
        const hasDownloads = cancellableEntries.some((entry) => entry.type === 'download');
        const hasUploads = cancellableEntries.some((entry) => entry.type === 'upload');

        let title: string;
        let message: string;
        let submitText: string;

        if (hasDownloads && hasUploads) {
            title = c('Title').t`Cancel all transfers?`;
            message = c('Info')
                .t`This will cancel any remaining uploads and downloads. Cancelled uploads won't be saved in ${DRIVE_APP_NAME}.`;
            submitText = c('Action').t`Cancel transfers`;
        } else if (hasDownloads) {
            title = c('Title').t`Cancel all downloads?`;
            message = c('Info').t`This will cancel any remaining downloads.`;
            submitText = c('Action').t`Cancel downloads`;
        } else {
            title = c('Title').t`Cancel all uploads?`;
            message = c('Info')
                .t`This will cancel any remaining uploads. Cancelled files won't be saved in ${DRIVE_APP_NAME}.`;
            submitText = c('Action').t`Cancel uploads`;
        }

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
                    if (isCancellable(entry)) {
                        cancelTransfer(entry);
                    }
                }
            },
        });
    };

    const share = async (entry: TransferManagerEntry) => {
        const uploadedItem = getUploadItem(entry.id);
        if (uploadedItem && uploadedItem.nodeUid) {
            showSharingModal({ nodeUid: uploadedItem.nodeUid, drive: getDrivePerNodeType(uploadedItem.type) });
        }
    };

    const retryFailedTransfers = (entries: TransferManagerEntry[]) => {
        for (const entry of entries) {
            if (isRetryable(entry)) {
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
        containsDocumentModal,
        showDocumentsModal,
        signatureIssueModal,
        showSignatureIssueModal,
        retryFailedTransfers,
    };
};
