import React, { useEffect, useState } from 'react';
import { ToolbarSeparator, Toolbar, ToolbarButton, useModals, useNotifications } from 'react-components';
import { c, msgid } from 'ttag';
import { DriveResource } from './DriveResourceProvider';
import useShare from '../../hooks/useShare';
import { ResourceType } from '../../interfaces/link';
import useFiles from '../../hooks/useFiles';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { getMetaForTransfer } from './Drive';
import { useDriveContent } from './DriveContentProvider';
import CreateFolderModal from '../CreateFolderModal';
import RenameModal from '../RenameModal';
import DetailsModal from '../DetailsModal';
import useTrash from '../../hooks/useTrash';

interface Props {
    resource: DriveResource;
    openResource: (resource: DriveResource) => void;
    parentLinkID?: string;
}

const DriveToolbar = ({ resource, openResource, parentLinkID }: Props) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { fileBrowserControls, addToLoadQueue } = useDriveContent();
    const { getFolderMeta } = useShare(resource.shareId);
    const { startFileTransfer } = useFiles(resource.shareId);
    const { trashLink } = useTrash(resource.shareId);
    const [parentID, setParentID] = useState(parentLinkID);

    const { selectedItems } = fileBrowserControls;

    useEffect(() => {
        let isCanceled = false;

        if (!parentLinkID) {
            getFolderMeta(resource.linkId).then(({ Link }) => !isCanceled && setParentID(Link.ParentLinkID));
        } else if (parentID !== parentLinkID) {
            setParentID(parentLinkID);
        }

        return () => {
            isCanceled = true;
        };
    }, [parentLinkID, resource.linkId]);

    const onlyFilesSelected = selectedItems.every((item) => item.Type === ResourceType.FILE);

    const handleBackClick = () => {
        if (parentID) {
            openResource({ shareId: resource.shareId, linkId: parentID, type: ResourceType.FOLDER });
        }
    };

    const handleDownloadClick = () => {
        selectedItems.forEach(async (item) => {
            const meta = getMetaForTransfer(item);
            const fileStream = await startFileTransfer(item.LinkID, meta);
            FileSaver.saveViaDownload(fileStream, meta);
        });
    };

    const handleCreateFolder = () => {
        // Reloads all folder contents after folder creation
        createModal(<CreateFolderModal onDone={() => addToLoadQueue(resource)} resource={resource} />);
    };

    const handleRename = () => {
        createModal(
            <RenameModal onDone={() => addToLoadQueue(resource)} item={selectedItems[0]} shareId={resource.shareId} />
        );
    };

    const handleDetailsClick = () => {
        createModal(<DetailsModal item={selectedItems[0]} resource={resource} />);
    };

    const handleDeleteClick = async () => {
        const toTrash = selectedItems;
        await Promise.all(toTrash.map((item) => trashLink(item.LinkID, item.ParentLinkID)));

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
        addToLoadQueue(resource);
    };

    return (
        <Toolbar>
            {
                <>
                    <ToolbarButton
                        disabled={!parentID}
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
