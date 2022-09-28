import { useModals } from '@proton/components';

import useNavigate from '../hooks/drive/useNavigate';
import { DecryptedLink, Device } from '../store';
import CreateFileModal from './CreateFileModal';
import CreateFolderModal from './CreateFolderModal';
import DetailsModal from './DetailsModal';
import FilesDetailsModal from './FilesDetailsModal';
import MoveToFolderModal from './MoveToFolderModal/MoveToFolderModal';
import RemoveDeviceModal from './RemoveDeviceModal';
import RenameDeviceModal from './RenameDeviceModal';
import RenameModal from './RenameModal';
import SelectedFileToShareModal from './SelectedFileToShareModal/SelectedFileToShareModal';
import ShareLinkModal from './ShareLinkModal/ShareLinkModal';
import { useSpotlight } from './useSpotlight';

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

    const openCreateFile = async () => {
        createModal(<CreateFileModal />);
    };

    const openDetails = (shareId: string, linkId: string) => {
        createModal(<DetailsModal shareId={shareId} linkId={linkId} />);
    };

    const openFilesDetails = (selectedItems: DecryptedLink[]) => {
        createModal(<FilesDetailsModal selectedItems={selectedItems} />);
    };

    const openMoveToFolder = (shareId: string, itemsToMove: DecryptedLink[]) => {
        if (!shareId || !itemsToMove.length) {
            return;
        }

        createModal(<MoveToFolderModal shareId={shareId} selectedItems={itemsToMove} />);
    };

    const openRename = (shareId: string, item: DecryptedLink) => {
        createModal(<RenameModal item={item} />);
    };

    const openFileSharing = (shareId: string) => {
        createModal(<SelectedFileToShareModal shareId={shareId} />);
    };

    const openLinkSharing = (shareId: string, linkId: string) => {
        createModal(<ShareLinkModal shareId={shareId} linkId={linkId} />);
    };

    const openRemoveDevice = (device: Device) => {
        createModal(<RemoveDeviceModal device={device} />);
    };

    const openRenameDevice = (device: Device) => {
        createModal(<RenameDeviceModal device={device} />);
    };

    return {
        openPreview,
        openCreateFolder,
        openCreateFile,
        openDetails,
        openFilesDetails,
        openMoveToFolder,
        openRename,
        openFileSharing,
        openLinkSharing,
        openRemoveDevice,
        openRenameDevice,
    };
}
