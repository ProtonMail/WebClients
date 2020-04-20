import React, { useEffect } from 'react';
import { c, msgid } from 'ttag';

import { ToolbarSeparator, Toolbar, ToolbarButton, useModals, useNotifications, useLoading } from 'react-components';

import { getMetaForTransfer } from './Drive';
import { useDriveContent } from './DriveContentProvider';
import useFiles from '../../hooks/useFiles';
import useTrash from '../../hooks/useTrash';
import useDrive from '../../hooks/useDrive';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import { FileBrowserItem } from '../FileBrowser/FileBrowser';
import CreateFolderModal from '../CreateFolderModal';
import RenameModal from '../RenameModal';
import DetailsModal from '../DetailsModal';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { getNotificationTextForItemList, takeActionForAllItems } from './helpers';
import { DriveFolder } from './DriveFolderProvider';
import { LinkType } from '../../interfaces/link';

interface Props {
    activeFolder: DriveFolder;
    openLink: (shareId: string, linkId: string, type: LinkType) => void;
}

const DriveToolbar = ({ activeFolder, openLink }: Props) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { fileBrowserControls } = useDriveContent();
    const { getLinkMeta, createNewFolder, renameLink, events } = useDrive();
    const { startFileTransfer } = useFiles();
    const { trashLink, restoreLink } = useTrash();
    const [moveToTrashLoading, withMoveToTrashLoading] = useLoading();
    const cache = useDriveCache();

    const { linkId, shareId } = activeFolder;

    const ParentLinkID = cache.get.linkMeta(shareId, linkId)?.ParentLinkID;
    const { selectedItems } = fileBrowserControls;

    useEffect(() => {
        if (!ParentLinkID) {
            getLinkMeta(shareId, linkId);
        }
    }, [shareId, linkId, ParentLinkID]);

    const handleBackClick = () => {
        if (ParentLinkID) {
            openLink(shareId, ParentLinkID, LinkType.FOLDER);
        }
    };

    const handleDownloadClick = () => {
        selectedItems.forEach(async (item) => {
            const meta = getMetaForTransfer(item);
            const fileStream = await startFileTransfer(shareId, item.LinkID, meta);
            FileSaver.saveViaDownload(fileStream, meta);
        });
    };

    const handleCreateFolder = async () => {
        createModal(
            <CreateFolderModal
                createNewFolder={async (name) => {
                    await createNewFolder(shareId, linkId, name);
                    events.call(shareId);
                }}
            />
        );
    };

    const handleRename = () => {
        const item = selectedItems[0];
        createModal(
            <RenameModal
                item={item}
                renameLink={async (name) => {
                    await renameLink(shareId, item.LinkID, item.ParentLinkID, name, item.Type);
                    events.call(shareId);
                }}
            />
        );
    };

    const handleDetailsClick = () => {
        createModal(<DetailsModal item={selectedItems[0]} activeFolder={activeFolder} getLinkMeta={getLinkMeta} />);
    };

    const moveToTrash = async () => {
        const toTrash = selectedItems;
        const trashedLinks = await takeActionForAllItems(toTrash, (item: FileBrowserItem) =>
            trashLink(shareId, item.LinkID)
        );

        const trashedLinksCount = trashedLinks.length;
        if (!trashedLinksCount) {
            return;
        }

        const undoAction = async () => {
            const restoredLinks = await takeActionForAllItems(toTrash, (item: FileBrowserItem) =>
                restoreLink(shareId, item.LinkID)
            );

            const restoredItemsCount = restoredLinks.length;
            if (!restoredItemsCount) {
                return;
            }

            const [{ Name: firstItemName }] = restoredLinks;
            const notificationMessages = {
                allFiles: c('Notification').ngettext(
                    msgid`"${firstItemName}" restored from Trash`,
                    `${restoredItemsCount} files restored from Trash`,
                    restoredItemsCount
                ),
                allFolders: c('Notification').ngettext(
                    msgid`"${firstItemName}" restored from Trash`,
                    `${restoredItemsCount} folders restored from Trash`,
                    restoredItemsCount
                ),
                mixed: c('Notification').ngettext(
                    msgid`"${firstItemName}" restored from Trash`,
                    `${restoredItemsCount} items restored from Trash`,
                    restoredItemsCount
                )
            };

            const notificationText = getNotificationTextForItemList(restoredLinks, notificationMessages);
            createNotification({ text: notificationText });
            await events.call(shareId);
        };

        const [{ Name: firstItemName }] = trashedLinks;
        const notificationMessages = {
            allFiles: c('Notification').ngettext(
                msgid`"${firstItemName}" moved to Trash`,
                `${trashedLinksCount} files moved to Trash`,
                trashedLinksCount
            ),
            allFolders: c('Notification').ngettext(
                msgid`"${firstItemName}" moved to Trash`,
                `${trashedLinksCount} folders moved to Trash`,
                trashedLinksCount
            ),
            mixed: c('Notification').ngettext(
                msgid`"${firstItemName}" moved to Trash`,
                `${trashedLinksCount} items moved to Trash`,
                trashedLinksCount
            )
        };

        const movedToTrashText = getNotificationTextForItemList(trashedLinks, notificationMessages, undoAction);
        createNotification({
            type: 'success',
            text: movedToTrashText
        });
        await events.call(shareId);
    };

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return <ToolbarButton icon="folder-new" title={c('Action').t`New Folder`} onClick={handleCreateFolder} />;
        }

        const isMultiSelect = selectedItems.length > 1;
        const hasFoldersSelected = selectedItems.some((item) => item.Type === LinkType.FOLDER);

        return (
            <>
                <ToolbarButton
                    disabled={hasFoldersSelected}
                    title={c('Action').t`Download`}
                    icon="download"
                    onClick={handleDownloadClick}
                />
                <ToolbarButton
                    disabled={isMultiSelect}
                    title={c('Action').t`Rename`}
                    icon="file-edit"
                    onClick={handleRename}
                />
                <ToolbarButton
                    disabled={isMultiSelect}
                    title={c('Action').t`Details`}
                    icon="info"
                    onClick={handleDetailsClick}
                />

                <ToolbarSeparator />

                <ToolbarButton
                    disabled={moveToTrashLoading}
                    title={c('Action').t`Move to Trash`}
                    icon="trash"
                    onClick={() => withMoveToTrashLoading(moveToTrash())}
                />
            </>
        );
    };

    return (
        <Toolbar>
            <ToolbarButton
                disabled={!ParentLinkID}
                title={c('Action').t`Back`}
                onClick={handleBackClick}
                icon="arrow-left"
            />

            <ToolbarSeparator />

            {renderSelectionActions()}
        </Toolbar>
    );
};

export default DriveToolbar;
