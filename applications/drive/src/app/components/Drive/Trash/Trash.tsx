import React, { useEffect } from 'react';
import FileBrowser, { FileBrowserItem } from '../../FileBrowser/FileBrowser';
import useFileBrowser from '../../FileBrowser/useFileBrowser';
import useTrash from '../../../hooks/useTrash';
import { mapLinksToChildren } from '../DriveContentProvider'; // TODO: fix weird location for this
import EmptyFolder from '../../FileBrowser/EmptyFolder';
import { useLoading } from 'react-components';
import { FOLDER_PAGE_SIZE } from '../../../constants';

interface Props {
    shareId: string;
    contents: FileBrowserItem[];
    setContents: (items: FileBrowserItem[]) => void;
    fileBrowserControls: ReturnType<typeof useFileBrowser>;
}

function Trash({ shareId, contents, setContents, fileBrowserControls }: Props) {
    const [loading, withLoading] = useLoading(true);
    const { fetchTrash } = useTrash(shareId);

    const {
        clearSelections,
        selectedItems,
        selectItem,
        toggleSelectItem,
        toggleAllSelected,
        selectRange
    } = fileBrowserControls;

    // TODO: request more than one page of links
    useEffect(() => {
        let cancelled = false;

        const loadTrashContents = async () => {
            const decryptedLinks = await fetchTrash(0, FOLDER_PAGE_SIZE);

            if (!cancelled) {
                setContents(mapLinksToChildren(decryptedLinks));
            }
        };

        withLoading(loadTrashContents());

        return () => {
            cancelled = true;
        };
    }, [shareId]);

    return !contents.length && !loading ? (
        <EmptyFolder />
    ) : (
        <FileBrowser
            loading={loading}
            contents={contents}
            selectedItems={selectedItems}
            onItemClick={selectItem}
            onToggleItemSelected={toggleSelectItem}
            onEmptyAreaClick={clearSelections}
            onToggleAllSelected={toggleAllSelected}
            onShiftClick={selectRange}
        />
    );
}

export default Trash;
