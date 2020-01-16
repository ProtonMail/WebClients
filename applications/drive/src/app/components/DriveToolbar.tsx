import React, { useEffect, useState } from 'react';
import { ToolbarSeparator, Toolbar, ToolbarButton } from 'react-components';
import { DriveResource } from './DriveResourceProvider';
import useShare from '../hooks/useShare';
import { FolderMeta, LinkType } from '../interfaces/folder';
import { FileBrowserItem, getMetaForTransfer } from './FileBrowser/FileBrowser';
import useFiles from '../hooks/useFiles';
import FileSaver from '../utils/FileSaver/FileSaver';

interface Props {
    selectedItems: FileBrowserItem[];
    resource: DriveResource;
    openResource: (resource: DriveResource) => void;
}

const DriveToolbar = ({ resource, openResource, selectedItems }: Props) => {
    const { getFolderMeta } = useShare(resource.shareId);
    const { downloadDriveFile } = useFiles(resource.shareId);
    const [folder, setFolder] = useState<FolderMeta>();

    useEffect(() => {
        getFolderMeta(resource.linkId).then(({ Folder }) => setFolder(Folder));
    }, [resource.linkId]);

    const onlyFilesSelected = selectedItems.every((item) => item.Type === LinkType.FILE);

    const handleBackClick = () => {
        if (folder?.ParentLinkID) {
            openResource({ shareId: resource.shareId, linkId: folder.ParentLinkID, type: LinkType.FOLDER });
        }
    };

    const handleDownloadClick = () => {
        selectedItems.forEach(async (item) => {
            const meta = getMetaForTransfer(item);
            const fileStream = await downloadDriveFile(item.LinkID, meta);
            FileSaver.saveViaDownload(fileStream, meta);
        });
    };

    return (
        <Toolbar>
            {folder?.ParentLinkID && (
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
