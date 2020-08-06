import React from 'react';
import { c } from 'ttag';

import { usePreventLeave, useModals } from 'react-components';

import useFiles from './useFiles';
import useTrash from './useTrash';
import useListNotifications from '../util/useListNotifications';
import useConfirm from '../util/useConfirm';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { getMetaForTransfer } from '../../utils/transfer';
import { logSettledErrors } from '../../utils/async';
import { LinkType } from '../../interfaces/link';
import { useDriveActiveFolder } from '../../components/Drive/DriveFolderProvider';
import { FileBrowserItem } from '../../components/FileBrowser/interfaces';
import RenameModal from '../../components/RenameModal';
import DetailsModal from '../../components/DetailsModal';
import MoveToFolderModal from '../../components/MoveToFolderModal';
import CreateFolderModal from '../../components/CreateFolderModal';

function useToolbarActions() {
    const { folder } = useDriveActiveFolder();
    const { startFileTransfer, startFolderTransfer } = useFiles();
    const { preventLeave } = usePreventLeave();
    const { createModal } = useModals();
    const { deleteLinks, restoreLinks, trashLinks } = useTrash();
    const {
        createDeleteLinksNotifications,
        createRestoredLinksNotifications,
        createTrashLinksNotifications,
    } = useListNotifications();
    const { openConfirmModal } = useConfirm();

    const download = async (itemsToDownload: FileBrowserItem[]) => {
        if (!folder) {
            return;
        }

        const promises = itemsToDownload.map(async (item) => {
            if (item.Type === LinkType.FILE) {
                const meta = getMetaForTransfer(item);
                const fileStream = await startFileTransfer(folder.shareId, item.LinkID, meta);
                preventLeave(FileSaver.saveAsFile(fileStream, meta)).catch(console.error);
            } else {
                const zipSaver = await FileSaver.saveAsZip(item.Name);

                if (zipSaver) {
                    try {
                        await preventLeave(
                            startFolderTransfer(item.Name, folder.shareId, item.LinkID, {
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
        const message = c('Info').t`permanently delete selected item(s) from Trash`;

        openConfirmModal(title, confirm, message, async () => {
            const deleted = await deleteLinks(
                shareId,
                itemsToDelete.map(({ LinkID }) => LinkID)
            );
            createDeleteLinksNotifications(itemsToDelete, deleted);
        });
    };

    const openDetails = (item: FileBrowserItem) => {
        if (!folder) {
            return;
        }

        createModal(<DetailsModal item={item} activeFolder={folder} />);
    };

    const openMoveToTrash = async (itemsToTrash: FileBrowserItem[]) => {
        if (!folder || !itemsToTrash.length) {
            return;
        }

        const { linkId, shareId } = folder;
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

    const openMoveToFolder = (itemsToMove: FileBrowserItem[]) => {
        if (!folder || !itemsToMove.length) {
            return;
        }

        createModal(<MoveToFolderModal activeFolder={folder} selectedItems={itemsToMove} />);
    };

    const openRename = (item: FileBrowserItem) => {
        if (!folder) {
            return;
        }

        createModal(<RenameModal activeFolder={folder} item={item} />);
    };

    const preview = (item: FileBrowserItem, openLink: (shareId: string, linkId: string, type: LinkType) => void) => {
        if (!folder) {
            return;
        }

        openLink(folder.shareId, item.LinkID, item.Type);
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

    return {
        download,
        openCreateFolder,
        openDeletePermanently,
        openDetails,
        openMoveToTrash,
        openMoveToFolder,
        openRename,
        preview,
        restoreFromTrash,
    };
}

export default useToolbarActions;
