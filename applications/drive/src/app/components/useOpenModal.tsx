import { useModals } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useNavigate from '../hooks/drive/useNavigate';
import CreateFolderModal from './CreateFolderModal';
import DetailsModal from './DetailsModal';
import FilesDetailsModal from './FilesDetailsModal';
import MoveToFolderModal from './MoveToFolderModal/MoveToFolderModal';
import RenameModal from './RenameModal';
import SelectedFileToShareModal from './SelectedFileToShareModal/SelectedFileToShareModal';
import ShareLinkModal from './ShareLinkModal/ShareLinkModal';
import ShareModal from './ShareModal/ShareModal';

export default function useOpenModal() {
    const { navigateToLink } = useNavigate();
    const { createModal } = useModals();

    const openPreview = (shareId: string, item: FileBrowserItem) => {
        navigateToLink(shareId, item.LinkID, item.Type);
    };

    const openCreateFolder = async () => {
        createModal(<CreateFolderModal />);
    };

    const openDetails = (shareId: string, item: FileBrowserItem) => {
        createModal(<DetailsModal item={item} shareId={shareId} />);
    };

    const openFilesDetails = (selectedItems: FileBrowserItem[]) => {
        createModal(<FilesDetailsModal selectedItems={selectedItems} />);
    };

    const openMoveToFolder = (shareId: string, itemsToMove: FileBrowserItem[]) => {
        if (!shareId || !itemsToMove.length) {
            return;
        }

        createModal(<MoveToFolderModal shareId={shareId} selectedItems={itemsToMove} />);
    };

    const openRename = (shareId: string, item: FileBrowserItem) => {
        createModal(<RenameModal shareId={shareId} item={item} />);
    };

    const openFileSharing = (shareId: string) => {
        createModal(<SelectedFileToShareModal shareId={shareId} />);
    };

    const openLinkSharing = (shareId: string, itemToShare: FileBrowserItem) => {
        createModal(<ShareLinkModal shareId={shareId} item={itemToShare} />);
    };

    const openSharing = (shareId: string, itemToShare: FileBrowserItem) => {
        createModal(<ShareModal shareId={shareId} item={itemToShare} />);
    };

    return {
        openPreview,
        openCreateFolder,
        openDetails,
        openFilesDetails,
        openMoveToFolder,
        openRename,
        openFileSharing,
        openLinkSharing,
        openSharing,
    };
}
