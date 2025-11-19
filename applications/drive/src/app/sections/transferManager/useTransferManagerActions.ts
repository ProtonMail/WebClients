import { useCallback } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useConfirmActionModal } from '@proton/components/index';
import { NodeType, splitNodeUid, useDrive } from '@proton/drive/index';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { useActiveShare } from '../../hooks/drive/useActiveShare';
import useDriveNavigation from '../../hooks/drive/useNavigate';
import { DownloadManager } from '../../managers/download/DownloadManager';
import { useSharingModal } from '../../modals/SharingModal/SharingModal';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { BaseTransferStatus, useDownloadManagerStore } from '../../zustand/download/downloadManager.store';
import { uploadManager } from '../../zustand/upload/uploadManager';
import { useUploadQueueStore } from '../../zustand/upload/uploadQueue.store';
import type { TransferManagerEntry } from './useTransferManagerState';

export const useTransferManagerActions = () => {
    const downloadManager = DownloadManager.getInstance();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [sharingModal, showSharingModal] = useSharingModal();
    const { getUploadItem } = useUploadQueueStore(useShallow((state) => ({ getUploadItem: state.getItem })));
    const { activeFolder } = useActiveShare();
    const { navigateToLink } = useDriveNavigation();
    const { drive } = useDrive();
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
                uploadManager.cancelUpload(entry.id);
            }
        },
        [downloadManager]
    );

    const retryTransfer = (entry: TransferManagerEntry) => {
        if (entry.type === 'download') {
            const item = getDownloadItem(entry.id);
            if (item?.unsupportedFileDetected) {
                updateDownloadItem(entry.id, { unsupportedFileDetected: 'detected' });
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

    const share = async (entry: TransferManagerEntry) => {
        const uploadedItem = getUploadItem(entry.id);
        if (uploadedItem && uploadedItem.nodeUid) {
            const { nodeId, volumeId } = splitNodeUid(uploadedItem.nodeUid);
            showSharingModal({
                volumeId: volumeId,
                linkId: nodeId,
                shareId: activeFolder.shareId,
            });
        }
    };

    const goToLocation = async (entry: TransferManagerEntry) => {
        const uploadedItem = getUploadItem(entry.id);
        if (!uploadedItem?.nodeUid) {
            return;
        }
        if (uploadedItem.type === NodeType.Folder) {
            const { nodeId } = splitNodeUid(uploadedItem.nodeUid);
            navigateToLink(activeFolder.shareId, nodeId, false);
        }

        if (uploadedItem.type === NodeType.File) {
            const maybeNode = await drive.getNode(uploadedItem.nodeUid);
            const { node } = getNodeEntity(maybeNode);
            if (node.parentUid) {
                const { nodeId } = splitNodeUid(node.parentUid);
                navigateToLink(activeFolder.shareId, nodeId, false);
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
        goToLocation,
    };
};
