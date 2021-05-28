import React from 'react';
import { c } from 'ttag';

import { usePreventLeave, useModals } from 'react-components';

import useQueuedFunction from '../util/useQueuedFunction';
import useFiles from './useFiles';
import useTrash from './useTrash';
import useNavigate from './useNavigate';
import useListNotifications from '../util/useListNotifications';
import useConfirm from '../util/useConfirm';
import useSharing from './useSharing';
import useDrive from './useDrive';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { getMetaForTransfer } from '../../utils/transfer';
import { logSettledErrors } from '../../utils/async';
import { LinkType } from '../../interfaces/link';
import { FileBrowserItem } from '../../components/FileBrowser/interfaces';
import { DriveFolder } from '../../components/Drive/DriveFolderProvider';
import RenameModal from '../../components/RenameModal';
import DetailsModal from '../../components/DetailsModal';
import MoveToFolderModal from '../../components/MoveToFolderModal';
import CreateFolderModal from '../../components/CreateFolderModal';
import SharingModal from '../../components/SharingModal/SharingModal';
import SelectedFileToShareModal from '../../components/SelectedFileToShareModal';
import FilesDetailsModal from '../../components/FilesDetailsModal';

function useToolbarActions() {
    const queuedFunction = useQueuedFunction();
    const { navigateToLink } = useNavigate();
    const { startFileTransfer, startFolderTransfer } = useFiles();
    const { preventLeave } = usePreventLeave();
    const { createModal } = useModals();
    const { deleteTrashedLinks, restoreLinks, trashLinks } = useTrash();
    const { deleteMultipleSharedLinks } = useSharing();
    const { events, deleteShare } = useDrive();

    const {
        createDeleteLinksNotifications,
        createRestoredLinksNotifications,
        createTrashLinksNotifications,
        createDeleteSharedLinksNotifications,
    } = useListNotifications();
    const { openConfirmModal } = useConfirm();

    const download = async (shareId: string, itemsToDownload: FileBrowserItem[]) => {
        const promises = itemsToDownload.map(async (item) => {
            if (item.Type === LinkType.FILE) {
                const meta = getMetaForTransfer(item);
                const fileStream = await startFileTransfer(shareId, item.LinkID, meta);
                preventLeave(FileSaver.saveAsFile(fileStream, meta)).catch(console.error);
            } else {
                const zipSaver = await FileSaver.saveAsZip(item.Name);

                if (zipSaver) {
                    try {
                        await preventLeave(
                            startFolderTransfer(item.Name, shareId, item.LinkID, {
                                onStartFileTransfer: zipSaver.addFile,
                                onStartFolderTransfer: zipSaver.addFolder,
                            })
                        );
                        await zipSaver.close();
                    } catch (e) {
                        await zipSaver.abort(e);
                    }
                }
            }
        });

        logSettledErrors(await Promise.allSettled(promises));
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
        const message = c('Info').t`Are you sure you want to permanently delete selected item(s) from trash?`;

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
        createModal(<SharingModal shareId={shareId} item={itemToShare} />);
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
            message: c('Info')
                .t`This will delete the link(s) and remove access to your file(s) for anyone with the link(s).`,
            onConfirm: async () => {
                const deletedCount = await deleteLinks(itemsToStopSharing);
                const failedCount = itemsToStopSharing.length - deletedCount;
                await events.callAll(shareId);
                createDeleteSharedLinksNotifications(deletedCount, failedCount);
            },
        });
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
    };
}

export default useToolbarActions;
