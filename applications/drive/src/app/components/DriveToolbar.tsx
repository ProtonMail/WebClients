import React, { useEffect, useState } from 'react';
import { ToolbarSeparator, Toolbar, ToolbarButton } from 'react-components';
import { DriveResource } from './DriveResourceProvider';
import useShare from '../hooks/useShare';
import { ResourceType } from '../interfaces/folder';
import { FileBrowserItem } from './FileBrowser/FileBrowser';
import useFiles from '../hooks/useFiles';
import FileSaver from '../utils/FileSaver/FileSaver';
import { getMetaForTransfer } from './Drive';

interface Props {
    selectedItems: FileBrowserItem[];
    resource: DriveResource;
    openResource: (resource: DriveResource, item?: FileBrowserItem) => void;
    parentLinkID?: string;
}

const DriveToolbar = ({ resource, openResource, selectedItems, parentLinkID }: Props) => {
    const { getFolderMeta } = useShare(resource.shareId);
    const { startFileTransfer } = useFiles(resource.shareId);
    const [parentID, setParentID] = useState(parentLinkID);

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

    return (
        <Toolbar>
            {parentID && (
                <>
                    <ToolbarButton onClick={handleBackClick} icon="arrow-left" />
                    <ToolbarSeparator />
                </>
            )}

            {onlyFilesSelected && selectedItems.length > 0 && (
                <ToolbarButton icon="download" onClick={handleDownloadClick} />
            )}
        </Toolbar>
    );
};

export default DriveToolbar;
