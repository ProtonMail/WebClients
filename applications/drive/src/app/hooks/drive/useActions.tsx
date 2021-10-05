import { c, msgid } from 'ttag';

import { usePreventLeave, useModals } from '@proton/components';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { DriveFolder } from './useActiveShare';
import { getMetaForTransfer } from '../../utils/transfer';
import CreateFolderModal from '../../components/CreateFolderModal';
import DetailsModal from '../../components/DetailsModal';
import FileSaver from '../../utils/FileSaver/FileSaver';
import FilesDetailsModal from '../../components/FilesDetailsModal';
import MoveToFolderModal from '../../components/MoveToFolderModal/MoveToFolderModal';
import RenameModal from '../../components/RenameModal';
import SelectedFileToShareModal from '../../components/SelectedFileToShareModal/SelectedFileToShareModal';
import ShareLinkModal from '../../components/ShareLinkModal/ShareLinkModal';
import ShareModal from '../../components/ShareModal/ShareModal';
import useConfirm from '../util/useConfirm';
import useDrive from './useDrive';
import useDriveEvents from './useDriveEvents';
import useFiles from './useFiles';
import useListNotifications from '../util/useListNotifications';
import useNavigate from './useNavigate';
import useQueuedFunction from '../util/useQueuedFunction';
import useSharing from './useSharing';
import useTrash from './useTrash';

function useActions() {
    const queuedFunction = useQueuedFunction();
    const { navigateToLink } = useNavigate();
    const { startFileTransfer, startFolderTransfer } = useFiles();
    const { preventLeave } = usePreventLeave();
    const { createModal } = useModals();
    const { deleteTrashedLinks, restoreLinks, trashLinks } = useTrash();
    const { deleteMultipleSharedLinks } = useSharing();
    const { deleteShare } = useDrive();
    const driveEvents = useDriveEvents();

    const {
        createDeleteLinksNotifications,
        createRestoredLinksNotifications,
        createTrashLinksNotifications,
        createDeleteSharedLinksNotifications,
    } = useListNotifications();
    const { openConfirmModal } = useConfirm();

    const download = async (shareId: string, itemsToDownload: FileBrowserItem[]) => {
        if (itemsToDownload.length === 1 && itemsToDownload[0].Type === LinkType.FILE) {
            const item = itemsToDownload[0];
            const meta = getMetaForTransfer(item);
            const fileStream = await startFileTransfer(shareId, item.LinkID, meta);
            preventLeave(FileSaver.saveAsFile(fileStream, meta)).catch(console.error);
        } else {
            const { name, linkID, children } =
                itemsToDownload.length === 1
                    ? {
                          name: itemsToDownload[0].Name,
                          linkID: itemsToDownload[0].LinkID,
                          children: [],
                      }
                    : {
                          name: `My files ${new Date().toISOString().substring(0, 19)}`,
                          linkID: '',
                          children: itemsToDownload,
                      };

            const zipSaver = await FileSaver.saveAsZip(name);
            if (zipSaver) {
                try {
                    await preventLeave(
                        startFolderTransfer(name, shareId, linkID, children, {
                            onStartFileTransfer: zipSaver.addFile,
                            onStartFolderTransfer: zipSaver.addFolder,
                        })
                    );
                    await zipSaver.close();
                } catch (e: any) {
                    await zipSaver.abort(e);
                }
            }
        }
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
                async (shareId: string) => {
                    return deleteShare(shareId);
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
                msgid`This will delete the link and remove access to your file for anyone with the link.`,
                `This will delete the links and remove access to your files for anyone with the links.`,
                itemsToStopSharing.length
            ),
            onConfirm: async () => {
                const deletedCount = await deleteLinks(itemsToStopSharing);
                const failedCount = itemsToStopSharing.length - deletedCount;
                await driveEvents.callAll(shareId);
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
