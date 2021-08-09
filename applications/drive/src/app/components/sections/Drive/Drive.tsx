import { useCallback, useEffect } from 'react';

import useDrive from '../../../hooks/drive/useDrive';
import useDriveDragMove from '../../../hooks/drive/useDriveDragMove';
import useNavigate from '../../../hooks/drive/useNavigate';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import { FileBrowser, FileBrowserItem } from '../../FileBrowser';
import { DriveFolder } from './DriveFolderProvider';
import { useDriveContent } from './DriveContentProvider';
import EmptyFolder from './EmptyFolder';
import FolderContextMenu from './FolderContextMenu';
import DriveItemContextMenu from './DriveItemContextMenu';

interface Props {
    activeFolder: DriveFolder;
}

function Drive({ activeFolder }: Props) {
    const cache = useDriveCache();
    const { getLinkMeta } = useDrive();
    const { navigateToLink } = useNavigate();
    const { loadNextPage, fileBrowserControls, loading, contents, complete, sortParams, setSorting } =
        useDriveContent();

    const { linkId, shareId } = activeFolder;
    const { clearSelections, selectedItems, toggleSelectItem, toggleAllSelected, toggleRange, selectItem } =
        fileBrowserControls;

    const folderName = cache.get.linkMeta(shareId, linkId)?.Name;
    const { getDragMoveControls } = useDriveDragMove(shareId, selectedItems, clearSelections);

    useEffect(() => {
        if (folderName === undefined) {
            getLinkMeta(shareId, linkId).catch(console.error);
        }
    }, [shareId, linkId, folderName]);

    const handleScrollEnd = useCallback(() => {
        const isInitialized = cache.get.childrenInitialized(shareId, linkId, sortParams);
        // Only load on scroll after initial load from backend
        if (isInitialized && !complete) {
            loadNextPage();
        }
    }, [complete, loadNextPage, shareId, linkId, sortParams]);

    const handleClick = useCallback(
        async (item: FileBrowserItem) => {
            document.getSelection()?.removeAllRanges();
            navigateToLink(shareId, item.LinkID, item.Type);
        },
        [navigateToLink, shareId]
    );

    return complete && !contents.length && !loading ? (
        <EmptyFolder />
    ) : (
        <FileBrowser
            type="drive"
            caption={folderName}
            shareId={shareId}
            loading={loading}
            contents={contents}
            selectedItems={selectedItems}
            sortParams={sortParams}
            setSorting={setSorting}
            onItemClick={handleClick}
            onToggleItemSelected={toggleSelectItem}
            clearSelections={clearSelections}
            onToggleAllSelected={toggleAllSelected}
            onShiftClick={toggleRange}
            selectItem={selectItem}
            getDragMoveControls={getDragMoveControls}
            onScrollEnd={handleScrollEnd}
            ItemContextMenu={DriveItemContextMenu}
            FolderContextMenu={FolderContextMenu}
        />
    );
}

export default Drive;
