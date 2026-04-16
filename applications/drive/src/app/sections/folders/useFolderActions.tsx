import { generateNodeUid, getDrive, useDrive } from '@proton/drive';
import { useSharingModal } from '@proton/drive/modules/sharingModal';
import { uploadManager } from '@proton/drive/modules/upload';

import { useUploadInput } from '../../hooks/drive/useUploadInput';
import { useCopyItemsModal } from '../../modals/CopyItemsModal';
import { useCreateFileModal } from '../../modals/CreateFileModal';
import { useCreateFolderModal } from '../../modals/CreateFolderModal';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../modals/FilesDetailsModal';
import { useMoveItemsModal } from '../../modals/MoveItemsModal';
import { useRenameModal } from '../../modals/RenameModal';
import { useRevisionsModal } from '../../modals/RevisionsModal';
import { useFileSharingModal } from '../../modals/SelectLinkToShareModal';
import { useDrivePreviewModal } from '../../modals/preview';
import { createDocument } from '../../utils/docs/openInDocs';
import { isPreviewOrFallbackAvailable } from '../../utils/isPreviewOrFallbackAvailable';
import { getPublicLinkIsExpired } from '../../utils/sdk/getPublicLinkIsExpired';
import type { FolderViewItem } from './useFolder.store';

type Props = {
    shareId: string;
    linkId: string;
    volumeId: string;
    allSortedItems: {
        nodeUid: string;
        mimeType?: string;
        storageSize: number;
    }[];
    selectedItems: FolderViewItem[];
};

export const toNodeUidsHelper = <T extends { volumeId: string; linkId: string }>(items: T[]): string[] =>
    items.map((item) => generateNodeUid(item.volumeId, item.linkId));

export const useFolderActions = ({ allSortedItems, selectedItems, shareId, linkId, volumeId }: Props) => {
    const { drive } = useDrive();
    const uid = generateNodeUid(volumeId, linkId);

    // Upload hooks
    const {
        inputRef: fileInputRef,
        handleClick: handleFileClick,
        handleChange: handleFileChange,
    } = useUploadInput({ onUpload: (files) => uploadManager.upload(files, uid) });

    const {
        inputRef: folderInputRef,
        handleClick: handleFolderClick,
        handleChange: handleFolderChange,
    } = useUploadInput({ onUpload: (files) => uploadManager.upload(files, uid), forFolders: true });

    // Modal hooks
    const { previewModal, showPreviewModal } = useDrivePreviewModal();
    const { createFolderModal, showCreateFolderModal } = useCreateFolderModal();
    const { createFileModal, showCreateFileModal } = useCreateFileModal();
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const { sharingModal, showSharingModal } = useSharingModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();
    const { filesDetailsModal, showFilesDetailsModal } = useFilesDetailsModal();
    const { revisionsModal, showRevisionsModal } = useRevisionsModal();
    const { renameModal, showRenameModal } = useRenameModal();
    const { moveItemsModal, showMoveItemsModal } = useMoveItemsModal();
    const { copyModal, showCopyItemsModal } = useCopyItemsModal();

    const getPreviewableNodeUids = () =>
        allSortedItems
            .filter((item) => item.mimeType && isPreviewOrFallbackAvailable(item.mimeType, item.storageSize))
            .map((item) => item.nodeUid);

    const showPreview = () => {
        const item = selectedItems[0];
        if (!item) {
            return;
        }

        showPreviewModal({
            deprecatedContextShareId: shareId,
            nodeUid: item.uid,
            previewableNodeUids: getPreviewableNodeUids(),
            // Force getDrive as it's folder section
            drive: getDrive(),
        });
    };

    const showPreviewForNode = (nodeUid: string) => {
        showPreviewModal({
            deprecatedContextShareId: shareId,
            nodeUid,
            previewableNodeUids: getPreviewableNodeUids(),
            // Force getDrive as it's folder section
            drive: getDrive(),
        });
    };

    const createFolder = () => showCreateFolderModal({ parentFolderUid: uid });

    const createNewDocument = () => {
        void createDocument({ type: 'doc', parentUid: uid });
    };

    const createNewSheet = () => {
        void createDocument({ type: 'sheet', parentUid: uid });
    };

    const moveAction = () => showMoveItemsModal({ nodeUids: toNodeUidsHelper(selectedItems) });

    const copyAction = () => showCopyItemsModal(selectedItems);

    const renameAction = () => {
        const item = selectedItems[0];
        if (!item) {
            return;
        }

        showRenameModal({
            nodeUid: item.uid,
        });
    };

    const showDetails = () => {
        if (selectedItems.length === 1) {
            const item = selectedItems[0];
            void showDetailsModal({ nodeUid: item.uid });
        } else if (selectedItems.length > 1) {
            void showFilesDetailsModal({
                nodeUids: selectedItems.map((item) => generateNodeUid(item.volumeId, item.linkId)),
            });
        }
    };

    const createShareLink = () => {
        if (selectedItems.length === 1) {
            const item = selectedItems[0];
            showSharingModal({
                nodeUid: generateNodeUid(item.volumeId, item.linkId),
                // For folder section so we can force getDrive
                drive: getDrive(),
            });
        } else {
            // In case nothing is selected we share the active folder
            // For folder section so we can force getDrive
            showSharingModal({ nodeUid: generateNodeUid(volumeId, linkId), drive: getDrive() });
        }
    };

    const createShare = () => showFileSharingModal({ showSharingModal: showSharingModal });

    const getPublicLinkInfo = async () => {
        if (selectedItems.length === 1) {
            const item = selectedItems.at(0);
            if (!item) {
                return;
            }
            const shareResult = await drive.getSharingInfo(item.uid);
            return {
                url: shareResult?.publicLink?.url,
                isExpired: getPublicLinkIsExpired(shareResult?.publicLink?.expirationTime),
            };
        }
    };

    return {
        // Upload
        uploadFile: { fileInputRef, handleFileClick, handleFileChange },
        uploadFolder: { folderInputRef, handleFolderClick, handleFolderChange },
        // Modal actions
        actions: {
            showPreviewModal: showPreview,
            showPreviewForNode,
            showSharingModal: createShareLink,
            showDetailsModal: showDetails,
            showRenameModal: renameAction,
            showMoveModal: moveAction,
            showCopyModal: copyAction,
            showCreateFolderModal: createFolder,
            showFileSharingModal: createShare,
            showCreateFileModal,
            showRevisionsModal,
            createNewDocument,
            createNewSheet,
            getPublicLinkInfo,
        },
        // Modals
        modals: {
            previewModal,
            createFolderModal,
            createFileModal,
            fileSharingModal,
            sharingModal,
            detailsModal,
            filesDetailsModal,
            revisionsModal,
            renameModal,
            moveItemsModal,
            copyModal,
        },
    };
};

export type FolderActions = ReturnType<typeof useFolderActions>['actions'];
export type FolderUploadFile = ReturnType<typeof useFolderActions>['uploadFile'];
export type FolderUploadFolder = ReturnType<typeof useFolderActions>['uploadFolder'];
