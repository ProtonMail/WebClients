import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import { useCreateFileModal } from '../../../components/modals/CreateFileModal';
import { useCreateFolderModal } from '../../../components/modals/CreateFolderModal';
import { useDetailsModal } from '../../../components/modals/DetailsModal';
import { useFilesDetailsModal } from '../../../components/modals/FilesDetailsModal';
import { useMoveToFolderModal } from '../../../components/modals/MoveToFolderModal/MoveToFolderModal';
import { useRenameModal } from '../../../components/modals/RenameModal';
import { useRevisionsModal } from '../../../components/modals/RevisionsModal/RevisionsModal';
import { useFileSharingModal } from '../../../components/modals/SelectLinkToShareModal/SelectLinkToShareModal';
import { useLinkSharingModal } from '../../../components/modals/ShareLinkModal/ShareLinkModal';
import { useActions, useDocumentActions, useFileUploadInput, useFolderUploadInput } from '../../../store';
import type { LegacyItem } from '../../../utils/sdk/mapNodeToLegacyItem';

type Props = {
    shareId: string;
    linkId: string;
    selectedItems: LegacyItem[];
};

export const useFolderActions = ({ selectedItems, shareId, linkId }: Props) => {
    const { createDocument } = useDocumentActions();
    const { renameLink } = useActions();

    // Upload hooks
    const {
        inputRef: fileInputRef,
        handleClick: handleFileClick,
        handleChange: handleFileChange,
    } = useFileUploadInput(shareId, linkId);

    const {
        inputRef: folderInputRef,
        handleClick: handleFolderClick,
        handleChange: handleFolderChange,
    } = useFolderUploadInput(shareId, linkId);

    // Modal hooks
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModal();
    const [createFileModal, showCreateFileModal] = useCreateFileModal();
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [revisionsModal, showRevisionsModal] = useRevisionsModal();
    const [renameModal, showRenameModal] = useRenameModal();
    const [moveModal, showMoveModal] = useMoveToFolderModal();

    const createFolder = () => showCreateFolderModal({ folder: { shareId, linkId } });

    const createNewDocument = () => {
        void createDocument({ type: 'doc', shareId: shareId, parentLinkId: linkId });
    };

    const createNewSheet = () => {
        void createDocument({ type: 'sheet', shareId: shareId, parentLinkId: linkId });
    };

    const moveAction = (shareId: string) => showMoveModal({ shareId, selectedItems });

    const renameAction = () => {
        const item = selectedItems[0];
        if (!item) {
            return;
        }

        showRenameModal({
            isFile: item.isFile,
            name: item.name,
            isDoc: isProtonDocsDocument(item.mimeType),
            volumeId: item.volumeId,
            linkId: item.linkId,
            onSubmit: (formattedName: string) =>
                renameLink(new AbortController().signal, item.rootShareId, item.linkId, formattedName),
        });
    };

    const showDetails = () => {
        if (selectedItems.length === 1) {
            const item = selectedItems[0];
            void showDetailsModal({
                volumeId: item.volumeId,
                shareId: item.rootShareId,
                linkId: item.linkId,
            });
        } else if (selectedItems.length > 1) {
            void showFilesDetailsModal({ selectedItems });
        }
    };

    const createShareLink = () => {
        if (selectedItems.length === 1) {
            const item = selectedItems[0];
            showLinkSharingModal({
                volumeId: item.volumeId,
                shareId: item.rootShareId,
                linkId: item.linkId,
            });
        }
    };

    const createShare = () => showFileSharingModal({ shareId, showLinkSharingModal });

    return {
        // Upload
        uploadFile: { fileInputRef, handleFileClick, handleFileChange },
        uploadFolder: { folderInputRef, handleFolderClick, handleFolderChange },
        // Modal actions
        actions: {
            showLinkSharingModal: createShareLink,
            showDetailsModal: showDetails,
            showRenameModal: renameAction,
            showMoveModal: moveAction,
            showCreateFolderModal: createFolder,
            showFileSharingModal: createShare,
            showCreateFileModal,
            showRevisionsModal,
            createNewDocument,
            createNewSheet,
        },
        // Modals
        modals: {
            createFolderModal,
            createFileModal,
            fileSharingModal,
            linkSharingModal,
            detailsModal,
            filesDetailsModal,
            revisionsModal,
            renameModal,
            moveModal,
        },
    };
};
