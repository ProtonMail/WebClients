import React, { useEffect, useState } from 'react';
import { useLoading } from 'react-components';
import { LinkType } from '../interfaces/folder';
import useShare from '../hooks/useShare';
import useFileBrowser from './FileBrowser/useFileBrowser';
import FileBrowser, { FileBrowserItem } from './FileBrowser/FileBrowser';
import useDownload from '../hooks/useDownload';
import DownloadsInfo from './downloads/DownloadsInfo/DownloadsInfo';

export type DriveResource = { shareId: string; type: LinkType; linkId: string };

interface Props {
    resource: DriveResource;
    openResource: (resource: DriveResource) => void;
}

function Drive({ resource, openResource }: Props) {
    const { getFolderContents } = useShare(resource.shareId);
    const { downloadDriveFile } = useDownload(resource.shareId);
    const [contents, setContents] = useState<FileBrowserItem[]>();
    const [loading, withLoading] = useLoading();

    const {
        clearSelections,
        selectedItems,
        selectItem,
        toggleSelectItem,
        toggleAllSelected,
        selectRange
    } = useFileBrowser(contents);

    useEffect(() => {
        let didCancel = false;

        const loadFolderContents = async () => {
            const decryptedLinks = await getFolderContents(resource.linkId);
            if (!didCancel) {
                setContents(
                    decryptedLinks.map(({ LinkID, Type, Name, Modified, Size }) => ({
                        Name,
                        LinkID,
                        Type,
                        Modified,
                        Size
                    }))
                );
            }
        };

        if (resource.type === LinkType.FOLDER) {
            clearSelections();
            withLoading(loadFolderContents());
        } else {
            throw Error('Files are unsupported yet');
        }

        return () => {
            didCancel = true;
        };
    }, [resource]);

    const handleDoubleClick = (item: FileBrowserItem) => {
        document.getSelection()?.removeAllRanges();
        if (item.Type === LinkType.FOLDER) {
            openResource({ shareId: resource.shareId, linkId: item.LinkID, type: item.Type });
        } else if (item.Type === LinkType.FILE) {
            downloadDriveFile(item.LinkID, item.Name);
        }
    };

    return (
        <>
            <FileBrowser
                loading={loading}
                contents={contents}
                selectedItems={selectedItems}
                onItemClick={selectItem}
                onToggleItemSelected={toggleSelectItem}
                onItemDoubleClick={handleDoubleClick}
                onEmptyAreaClick={clearSelections}
                onToggleAllSelected={toggleAllSelected}
                onShiftClick={selectRange}
            />
            <DownloadsInfo />
        </>
    );
}

export default Drive;
