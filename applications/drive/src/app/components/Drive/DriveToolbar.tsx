import React, { useEffect } from 'react';
import { ToolbarSeparator, Toolbar, ToolbarButton, useModals, useNotifications } from 'react-components';
import { c, msgid } from 'ttag';
import { DriveResource } from './DriveResourceProvider';
import { ResourceType } from '../../interfaces/link';
import useFiles from '../../hooks/useFiles';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { getMetaForTransfer } from './Drive';
import { useDriveContent } from './DriveContentProvider';
import CreateFolderModal from '../CreateFolderModal';
import RenameModal from '../RenameModal';
import DetailsModal from '../DetailsModal';
import useTrash from '../../hooks/useTrash';
import useDrive from '../../hooks/useDrive';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';

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
    const { trashLink } = useTrash();
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
        await Promise.all(toTrash.map((item) => trashLink(resource.shareId, item.LinkID)));

        const allFiles = toTrash.every(({ Type }) => Type === ResourceType.FILE);
        const allFolders = toTrash.every(({ Type }) => Type === ResourceType.FOLDER);

        const notificationTexts = {
            allFiles: c('Notification').ngettext(
                msgid`"${toTrash[0].Name}" moved to Trash`,
                `${toTrash.length} files moved to Trash`,
                toTrash.length
            ),
            allFolders: c('Notification').ngettext(
                msgid`"${toTrash[0].Name}" moved to Trash`,
                `${toTrash.length} folders moved to Trash`,
                toTrash.length
            ),
            mixed: c('Notification').ngettext(
                msgid`"${toTrash[0].Name}" moved to Trash`,
                `${toTrash.length} items moved to Trash`,
                toTrash.length
            )
        };

        const notificationText =
            (allFiles && notificationTexts.allFiles) ||
            (allFolders && notificationTexts.allFolders) ||
            notificationTexts.mixed;

        createNotification({ text: notificationText });
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
                    <ToolbarButton title={c('Action').t`Move to trash`} icon="trash" onClick={handleDeleteClick} />
                </>
            )}
        </Toolbar>
    );
};

export default DriveToolbar;
