import React, { useEffect, useState } from 'react';
import { ToolbarSeparator, Toolbar, ToolbarButton, useModals } from 'react-components';
import { DriveResource } from './DriveResourceProvider';
import useShare from '../../hooks/useShare';
import { ResourceType } from '../../interfaces/folder';
import useFiles from '../../hooks/useFiles';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { getMetaForTransfer } from './Drive';
import { useDriveContent } from './DriveContentProvider';
import CreateFolderModal from '../CreateFolderModal';
import { c } from 'ttag';

interface Props {
    resource: DriveResource;
    openResource: (resource: DriveResource) => void;
    parentLinkID?: string;
}

const DriveToolbar = ({ resource, openResource, parentLinkID }: Props) => {
    const { createModal } = useModals();
    const { fileBrowserControls, addToLoadQueue } = useDriveContent();
    const { getFolderMeta } = useShare(resource.shareId);
    const { startFileTransfer } = useFiles(resource.shareId);
    const [parentID, setParentID] = useState(parentLinkID);

    const { selectedItems } = fileBrowserControls;

    useEffect(() => {
        let isCanceled = false;

        if (!parentLinkID) {
            getFolderMeta(resource.linkId).then(({ Folder }) => !isCanceled && setParentID(Folder.ParentLinkID));
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

    const handleCreateFolder = async () => {
        // Reloads all folder contents after folder creation
        await createModal(<CreateFolderModal onDone={() => addToLoadQueue(resource)} resource={resource} />);
    };

    return (
        <Toolbar>
            {parentID && (
                <>
                    <ToolbarButton title={c('Action').t`Back`} onClick={handleBackClick} icon="arrow-left" />
                    <ToolbarSeparator />
                </>
            )}

            <ToolbarButton title={c('Action').t`New folder`} icon="folder" onClick={handleCreateFolder} />
            {onlyFilesSelected && selectedItems.length > 0 && (
                <ToolbarButton title={c('Action').t`Download`} icon="download" onClick={handleDownloadClick} />
            )}
        </Toolbar>
    );
};

export default DriveToolbar;
