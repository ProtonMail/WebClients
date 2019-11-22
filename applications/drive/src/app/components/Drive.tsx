import React, { useEffect, useState } from 'react';
import { useLoading } from 'react-components';
import { LinkType } from '../interfaces/folder';
import useShare from '../hooks/useShare';
import useFileBrowser from './FileBrowser/useFileBrowser';
import FileBrowser, { FileBrowserItem } from './FileBrowser/FileBrowser';

export type DriveResource = { shareId: string; type: LinkType; linkId: string };

interface Props {
    resource: DriveResource;
    openResource: (resource: DriveResource) => void;
}

function Drive({ resource, openResource }: Props) {
    const { getFolderContents } = useShare(resource.shareId);
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
                    decryptedLinks.map(({ LinkID, Type, Name, Modified }) => ({
                        Name,
                        LinkID,
                        Type,
                        Modified
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

    const navigateToItem = (linkId: string, type: LinkType) =>
        openResource({ shareId: resource.shareId, linkId, type });

    return (
        <FileBrowser
            loading={loading}
            contents={contents}
            selectedItems={selectedItems}
            onItemClick={selectItem}
            onToggleItemSelected={toggleSelectItem}
            onItemDoubleClick={navigateToItem}
            onEmptyAreaClick={clearSelections}
            onToggleAllSelected={toggleAllSelected}
            onShiftClick={selectRange}
        />
    );
}

export default Drive;
