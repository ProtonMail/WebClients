import React, { useEffect } from 'react';
import { c, msgid } from 'ttag';

import { ToolbarSeparator, Toolbar, ToolbarButton, useModals, useNotifications } from 'react-components';

import { getMetaForTransfer } from './Drive';
import { DriveResource } from './DriveResourceProvider';
import { useDriveContent } from './DriveContentProvider';
import useFiles from '../../hooks/useFiles';
import useTrash from '../../hooks/useTrash';
import useDrive from '../../hooks/useDrive';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import { FileBrowserItem } from '../FileBrowser/FileBrowser';
import CreateFolderModal from '../CreateFolderModal';
import RenameModal from '../RenameModal';
import DetailsModal from '../DetailsModal';
import { ResourceType } from '../../interfaces/link';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { getNotificationTextForItemList, takeActionForAllItems } from './helpers';

interface Props {
    resource: DriveResource;
    openResource: (resource: DriveResource) => void;
}

const DriveToolbar = ({ resource, openResource }: Props) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { fileBrowserControls } = useDriveContent();
    const { getLinkMeta, createNewFolder, renameLink, events } = useDrive();
    const { startFileTransfer } = useFiles();
    const { trashLink, restoreLink } = useTrash();
    const cache = useDriveCache();

    const ParentLinkID = cache.get.linkMeta(resource.shareId, resource.linkId)?.ParentLinkID;
    const { selectedItems } = fileBrowserControls;

    useEffect(() => {
        if (!ParentLinkID) {
            getLinkMeta(resource.shareId, resource.linkId);
        }
    }, [resource.shareId, resource.linkId, ParentLinkID]);

    const onlyFilesSelected = selectedItems.every((item) => item.Type === ResourceType.FILE);

    const handleBackClick = () => {
        if (ParentLinkID) {
            openResource({ shareId: resource.shareId, linkId: ParentLinkID, type: ResourceType.FOLDER });
        }
    };

    const handleDownloadClick = () => {
        selectedItems.forEach(async (item) => {
            const meta = getMetaForTransfer(item);
            const fileStream = await startFileTransfer(resource.shareId, item.LinkID, meta);
            FileSaver.saveViaDownload(fileStream, meta);
        });
    };

    const handleCreateFolder = async () => {
        createModal(
            <CreateFolderModal
                createNewFolder={async (name) => {
                    await createNewFolder(resource.shareId, resource.linkId, name);
                    events.call(resource.shareId);
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
                    await renameLink(resource.shareId, item.LinkID, item.ParentLinkID, name);
                    events.call(resource.shareId);
                }}
            />
        );
    };

    const handleDetailsClick = () => {
        createModal(<DetailsModal item={selectedItems[0]} resource={resource} getLinkMeta={getLinkMeta} />);
    };

    const handleDeleteClick = async () => {
        const toTrash = selectedItems;
        const trashedLinks = await takeActionForAllItems(toTrash, (item: FileBrowserItem) =>
            trashLink(resource.shareId, item.LinkID)
        );

        const trashedLinksCount = trashedLinks.length;
        if (!trashedLinksCount) {
            return;
        }

        const undoAction = async () => {
            const restoredLinks = await takeActionForAllItems(toTrash, (item: FileBrowserItem) =>
                restoreLink(resource.shareId, item.LinkID)
            );

            const restoredItemsCount = restoredLinks.length;
            if (!restoredItemsCount) {
                return;
            }

            const [{ Name: firstItemName }] = restoredLinks;
            const notificationMessages = {
                allFiles: c('Notification').ngettext(
                    msgid`"${firstItemName}" restored from Trash.`,
                    `${restoredItemsCount} files restored from Trash.`,
                    restoredItemsCount
                ),
                allFolders: c('Notification').ngettext(
                    msgid`"${firstItemName}" restored from Trash.`,
                    `${restoredItemsCount} folders restored from Trash.`,
                    restoredItemsCount
                ),
                mixed: c('Notification').ngettext(
                    msgid`"${firstItemName}" restored from Trash.`,
                    `${restoredItemsCount} items restored from Trash.`,
                    restoredItemsCount
                )
            };

            const notificationText = getNotificationTextForItemList(restoredLinks, notificationMessages);
            createNotification({ text: notificationText });
            await events.call(resource.shareId);
        };

        const [{ Name: firstItemName }] = trashedLinks;
        const notificationMessages = {
            allFiles: c('Notification').ngettext(
                msgid`"${firstItemName}" moved to Trash.`,
                `${trashedLinksCount} files moved to Trash.`,
                trashedLinksCount
            ),
            allFolders: c('Notification').ngettext(
                msgid`"${firstItemName}" moved to Trash.`,
                `${trashedLinksCount} folders moved to Trash.`,
                trashedLinksCount
            ),
            mixed: c('Notification').ngettext(
                msgid`"${firstItemName}" moved to Trash.`,
                `${trashedLinksCount} items moved to Trash.`,
                trashedLinksCount
            )
        };

        const movedToTrashText = getNotificationTextForItemList(trashedLinks, notificationMessages, undoAction);
        createNotification({
            type: 'success',
            text: movedToTrashText
        });
        await events.call(resource.shareId);
    };

    return (
        <Toolbar>
            {
                <>
                    <ToolbarButton
                        disabled={!ParentLinkID}
                        title={c('Action').t`Back`}
                        onClick={handleBackClick}
                        icon="arrow-left"
                    />
                    <ToolbarSeparator />
                </>
            }

            <ToolbarButton icon="folder-new" title={c('Action').t`New Folder`} onClick={handleCreateFolder} />
            {selectedItems.length === 1 && (
                <>
                    <ToolbarButton title={c('Action').t`Rename`} icon="file-edit" onClick={handleRename} />
                    <ToolbarButton title={c('Action').t`Details`} icon="info" onClick={handleDetailsClick} />
                </>
            )}
            {onlyFilesSelected && selectedItems.length > 0 && (
                <ToolbarButton title={c('Action').t`Download`} icon="download" onClick={handleDownloadClick} />
            )}
            {selectedItems.length > 0 && (
                <>
                    <ToolbarSeparator />
                    <ToolbarButton title={c('Action').t`Move to Trash`} icon="trash" onClick={handleDeleteClick} />
                </>
            )}
        </Toolbar>
    );
};

export default DriveToolbar;
