import { useModals } from '@proton/components';

import { DecryptedLink } from '../store';
import useNavigate from '../hooks/drive/useNavigate';
import { useSpotlight } from './useSpotlight';
import CreateFolderModal from './CreateFolderModal';
import DetailsModal from './DetailsModal';
import FilesDetailsModal from './FilesDetailsModal';
import MoveToFolderModal from './MoveToFolderModal/MoveToFolderModal';
import RenameModal from './RenameModal';
import SelectedFileToShareModal from './SelectedFileToShareModal/SelectedFileToShareModal';
import ShareLinkModal from './ShareLinkModal/ShareLinkModal';

export default function useOpenModal() {
    const { navigateToLink } = useNavigate();
    const { createModal } = useModals();
    const spotlight = useSpotlight();

    const openPreview = (shareId: string, linkId: string) => {
        spotlight.searchSpotlight.close();
        navigateToLink(shareId, linkId, true);
    };

    const openCreateFolder = async () => {
        createModal(<CreateFolderModal />);
    };

    const openDetails = (shareId: string, linkId: string) => {
        createModal(<DetailsModal shareId={shareId} linkId={linkId} />);
    };

    const openFilesDetails = (shareId: string, linkIds: string[]) => {
        createModal(<FilesDetailsModal shareId={shareId} linkIds={linkIds} />);
    };

    const openMoveToFolder = (shareId: string, itemsToMove: DecryptedLink[]) => {
        if (!shareId || !itemsToMove.length) {
            return;
        }

        createModal(<MoveToFolderModal shareId={shareId} selectedItems={itemsToMove} />);
    };

    const openRename = (shareId: string, item: DecryptedLink) => {
        createModal(<RenameModal shareId={shareId} item={item} />);
    };

    const openFileSharing = (shareId: string) => {
        createModal(<SelectedFileToShareModal shareId={shareId} />);
    };

    const openLinkSharing = (shareId: string, linkId: string) => {
        createModal(<ShareLinkModal shareId={shareId} linkId={linkId} />);
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
    };
}
