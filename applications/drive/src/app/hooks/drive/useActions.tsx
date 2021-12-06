import { c, msgid } from 'ttag';

import { useModals } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useDownloadProvider } from '../../components/downloads/DownloadProvider';
import CreateFolderModal from '../../components/CreateFolderModal';
import DetailsModal from '../../components/DetailsModal';
import FilesDetailsModal from '../../components/FilesDetailsModal';
import MoveToFolderModal from '../../components/MoveToFolderModal/MoveToFolderModal';
import RenameModal from '../../components/RenameModal';
import SelectedFileToShareModal from '../../components/SelectedFileToShareModal/SelectedFileToShareModal';
import ShareLinkModal from '../../components/ShareLinkModal/ShareLinkModal';
import ShareModal from '../../components/ShareModal/ShareModal';
import useConfirm from '../util/useConfirm';
import useListNotifications from '../util/useListNotifications';
import { DriveFolder } from './useActiveShare';
import useDrive from './useDrive';
import useNavigate from './useNavigate';
import useQueuedFunction from '../util/useQueuedFunction';
import useSharing from './useSharing';
import useTrash from './useTrash';

function useActions() {
    const queuedFunction = useQueuedFunction();
    const { navigateToLink } = useNavigate();
    const { createModal } = useModals();
    const { deleteTrashedLinks, restoreLinks, trashLinks } = useTrash();
    const { deleteMultipleSharedLinks } = useSharing();
    const { deleteShare } = useDrive();
    const { download: downloadLinks } = useDownloadProvider();

    const {
        createDeleteLinksNotifications,
        createRestoredLinksNotifications,
        createTrashLinksNotifications,
        createDeleteSharedLinksNotifications,
    } = useListNotifications();
    const { openConfirmModal } = useConfirm();

    const download = async (shareId: string, itemsToDownload: FileBrowserItem[]) => {
        return downloadLinks(
            itemsToDownload.map((item) => ({
                type: item.Type,
                shareId,
                linkId: item.LinkID,
                name: item.Name,
                mimeType: item.MIMEType,
                size: item.Size,
            }))
        );
    };

    const openCreateFolder = async () => {
        createModal(<CreateFolderModal />);
    };

    const openDeletePermanently = async (shareId: string, itemsToDelete: FileBrowserItem[]) => {
        if (!itemsToDelete.length) {
            return;
        }

        const title = c('Title').t`Delete permanently`;
        const confirm = c('Action').t`Delete permanently`;
        const message = c('Info').ngettext(
            msgid`Are you sure you want to permanently delete selected item from trash?`,
            `Are you sure you want to permanently delete selected items from trash?`,
            itemsToDelete.length
        );

        openConfirmModal({
            title,
            confirm,
            message,
            onConfirm: async () => {
                const deleted = await deleteTrashedLinks(
                    shareId,
                    itemsToDelete.map(({ LinkID }) => LinkID)
                );
                createDeleteLinksNotifications(itemsToDelete, deleted);
            },
        });
    };

    const openDetails = (shareId: string, item: FileBrowserItem) => {
        createModal(<DetailsModal item={item} shareId={shareId} />);
    };

    const openFilesDetails = (selectedItems: FileBrowserItem[]) => {
        createModal(<FilesDetailsModal selectedItems={selectedItems} />);
    };

    const openMoveToTrash = async (sourceFolder: DriveFolder, itemsToTrash: FileBrowserItem[]) => {
        if (!sourceFolder || !itemsToTrash.length) {
            return;
        }

        const { linkId, shareId } = sourceFolder;
        const trashed = await trashLinks(
            shareId,
            linkId,
            itemsToTrash.map(({ LinkID }) => LinkID)
        );

        const undoAction = async () => {
            const result = await restoreLinks(
                shareId,
                itemsToTrash.map(({ LinkID }) => LinkID)
            );
            createRestoredLinksNotifications(itemsToTrash, result);
        };

        createTrashLinksNotifications(itemsToTrash, trashed, undoAction);
    };

    const openMoveToFolder = (sourceFolder: DriveFolder, itemsToMove: FileBrowserItem[]) => {
        if (!sourceFolder || !itemsToMove.length) {
            return;
        }

        createModal(<MoveToFolderModal activeFolder={sourceFolder} selectedItems={itemsToMove} />);
    };

    const openRename = (shareId: string, item: FileBrowserItem) => {
        createModal(<RenameModal shareId={shareId} item={item} />);
    };

    const preview = (shareId: string, item: FileBrowserItem) => {
        navigateToLink(shareId, item.LinkID, item.Type);
    };

    const restoreFromTrash = async (shareId: string, itemsToRestore: FileBrowserItem[]) => {
        if (!itemsToRestore.length) {
            return;
        }

        const result = await restoreLinks(
            shareId,
            itemsToRestore.map(({ LinkID }) => LinkID)
        );
        createRestoredLinksNotifications(itemsToRestore, result);
    };

    const openFileSharing = (shareId: string) => {
        createModal(<SelectedFileToShareModal shareId={shareId} />);
    };

    const openLinkSharing = (shareId: string, itemToShare: FileBrowserItem) => {
        createModal(<ShareLinkModal shareId={shareId} item={itemToShare} />);
    };

    const openStopSharing = (shareId: string, itemsToStopSharing: FileBrowserItem[]) => {
        if (!itemsToStopSharing.length) {
            return;
        }

        const deleteLinks = async (links: FileBrowserItem[]) => {
            const urlShareIds: string[] = [];
            const deleteSharePromiseList: Promise<any>[] = [];
            const deleteShareQueued = queuedFunction(
                'deleteShare',
                async (itemShareId: string) => {
                    return deleteShare(itemShareId);
                },
                5
            );

            links.forEach(({ SharedUrl }) => {
                if (SharedUrl) {
                    urlShareIds.push(SharedUrl.ShareUrlID);
                }
            });

            const deletedSharedUrlIds = await deleteMultipleSharedLinks(shareId, urlShareIds);

            links.forEach(({ ShareUrlShareID, SharedUrl }) => {
                if (ShareUrlShareID && SharedUrl?.ShareUrlID && deletedSharedUrlIds.includes(SharedUrl?.ShareUrlID)) {
                    deleteSharePromiseList.push(deleteShareQueued(ShareUrlShareID));
                }
            });

            await Promise.all(deleteSharePromiseList);
            return deletedSharedUrlIds.length;
        };

        openConfirmModal({
            title: c('Title').t`Stop sharing`,
            confirm: c('Title').t`Stop sharing`,
            message: c('Info').ngettext(
                msgid`This will delete the link and remove access to your file or folder for anyone with the link.`,
                `This will delete the links and remove access to your files or folders for anyone with the links.`,
                itemsToStopSharing.length
            ),
            onConfirm: async () => {
                const deletedCount = await deleteLinks(itemsToStopSharing);
                const failedCount = itemsToStopSharing.length - deletedCount;

                createDeleteSharedLinksNotifications(deletedCount, failedCount);
            },
        });
    };

    const openSharing = (shareId: string, itemToShare: FileBrowserItem) => {
        createModal(<ShareModal shareId={shareId} item={itemToShare} />);
    };

    return {
        download,
        openCreateFolder,
        openDeletePermanently,
        openDetails,
        openFilesDetails,
        openMoveToTrash,
        openMoveToFolder,
        openRename,
        preview,
        restoreFromTrash,
        openFileSharing,
        openLinkSharing,
        openStopSharing,
        openSharing,
    };
}

export default useActions;
