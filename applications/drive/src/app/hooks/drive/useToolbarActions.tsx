import React from 'react';

import { usePreventLeave, useModals } from 'react-components';

import useFiles from './useFiles';
import useTrash from './useTrash';
import { useDriveActiveFolder } from '../../components/Drive/DriveFolderProvider';
import { FileBrowserItem } from '../../components/FileBrowser/interfaces';
import RenameModal from '../../components/RenameModal';
import DetailsModal from '../../components/DetailsModal';
import MoveToFolderModal from '../../components/MoveToFolderModal';
import CreateFolderModal from '../../components/CreateFolderModal';
import { LinkType } from '../../interfaces/link';
import { getMetaForTransfer } from '../../utils/transfer';
import { logSettledErrors } from '../../utils/async';
import FileSaver from '../../utils/FileSaver/FileSaver';
import useListNotifications from '../util/useListNotifications';

function useToolbarActions() {
    const { folder } = useDriveActiveFolder();
    const { startFileTransfer, startFolderTransfer } = useFiles();
    const { preventLeave } = usePreventLeave();
    const { createModal } = useModals();
    const { trashLinks, restoreLinks } = useTrash();
    const { createRestoredLinksNotifications, createTrashLinksNotifications } = useListNotifications();

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

    return {
        download,
        openCreateFolder,
        openDetails,
        openMoveToTrash,
        openMoveToFolder,
        openRename,
        preview,
    };
}

export default useToolbarActions;
