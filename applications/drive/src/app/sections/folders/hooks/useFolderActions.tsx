import { generateNodeUid, useDrive } from '@proton/drive';

import { useCreateFileModal } from '../../../components/modals/CreateFileModal';
import { useFilesDetailsModal } from '../../../components/modals/FilesDetailsModal';
import { useRevisionsModal } from '../../../components/modals/RevisionsModal/RevisionsModal';
import { useFileSharingModal } from '../../../components/modals/SelectLinkToShareModal/SelectLinkToShareModal';
import useOpenPreview from '../../../components/useOpenPreview';
import { useFlagsDriveSDKPreview } from '../../../flags/useFlagsDriveSDKPreview';
import { useCopyItemsModal } from '../../../modals/CopyItemsModal';
import { useCreateFolderModal } from '../../../modals/CreateFolderModal';
import { useDetailsModal } from '../../../modals/DetailsModal';
import { useMoveItemsModal } from '../../../modals/MoveItemsModal';
import { useRenameModal } from '../../../modals/RenameModal';
import { useSharingModal } from '../../../modals/SharingModal/SharingModal';
import { useDrivePreviewModal } from '../../../modals/preview';
import { useDocumentActions, useFileUploadInput, useFolderUploadInput } from '../../../store';
import { isPreviewOrFallbackAvailable } from '../../../utils/isPreviewOrFallbackAvailable';
import { getPublicLinkIsExpired } from '../../../utils/sdk/getPublicLinkIsExpired';
import type { LegacyItem } from '../../../utils/sdk/mapNodeToLegacyItem';

type Props = {
    shareId: string;
    linkId: string;
    volumeId: string;
    allSortedItems: {
        nodeUid: string;
        mimeType?: string;
        storageSize: number;
    }[];
    selectedItems: LegacyItem[];
};

export const useFolderActions = ({ allSortedItems, selectedItems, shareId, linkId, volumeId }: Props) => {
    const { createDocument } = useDocumentActions();
    const { drive } = useDrive();
    const uid = generateNodeUid(volumeId, linkId);

    const isSDKPreviewEnabled = useFlagsDriveSDKPreview();
    const openLegacyPreview = useOpenPreview();

    // Upload hooks
    const {
        inputRef: fileInputRef,
        handleClick: handleFileClick,
        handleChange: handleFileChange,
    } = useFileUploadInput(volumeId, shareId, linkId);

    const {
        inputRef: folderInputRef,
        handleClick: handleFolderClick,
        handleChange: handleFolderChange,
    } = useFolderUploadInput(volumeId, shareId, linkId);

    // Modal hooks
    const { previewModal, showPreviewModal } = useDrivePreviewModal();
    const { createFolderModal, showCreateFolderModal } = useCreateFolderModal();
    const [createFileModal, showCreateFileModal] = useCreateFileModal();
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const { sharingModal, showSharingModal } = useSharingModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [revisionsModal, showRevisionsModal] = useRevisionsModal();
    const { renameModal, showRenameModal } = useRenameModal();
    const { moveItemsModal, showMoveItemsModal } = useMoveItemsModal();
    const { copyModal, showCopyItemsModal } = useCopyItemsModal();

    const showPreview = () => {
        const item = selectedItems[0];
        if (!item) {
            return;
        }

        if (isSDKPreviewEnabled) {
            const previewableNodeUids = allSortedItems
                .filter((item) => item.mimeType && isPreviewOrFallbackAvailable(item.mimeType, item.storageSize))
                .map((item) => item.nodeUid);

            showPreviewModal({
                deprecatedContextShareId: shareId,
                nodeUid: item.uid,
                previewableNodeUids,
            });
        } else {
            openLegacyPreview(shareId, linkId);
        }
    };

    const createFolder = () => showCreateFolderModal({ parentFolderUid: uid });

    const createNewDocument = () => {
        void createDocument({ type: 'doc', shareId: shareId, parentLinkId: linkId });
    };

    const createNewSheet = () => {
        void createDocument({ type: 'sheet', shareId: shareId, parentLinkId: linkId });
    };

    const moveAction = (shareId: string) => showMoveItemsModal({ shareId, items: selectedItems });

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
            void showFilesDetailsModal({ selectedItems });
        }
    };

    const createShareLink = () => {
        if (selectedItems.length === 1) {
            const item = selectedItems[0];
            showSharingModal({ nodeUid: generateNodeUid(item.volumeId, item.linkId) });
        } else {
            // In case nothing is selected we share the active folder
            showSharingModal({ nodeUid: generateNodeUid(volumeId, linkId) });
        }
    };

    const createShare = () => showFileSharingModal({ shareId, showSharingModal: showSharingModal });

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
