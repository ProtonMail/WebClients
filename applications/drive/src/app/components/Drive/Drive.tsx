import React, { useCallback, useEffect, useRef } from 'react';

import useOnScrollEnd from '../../hooks/util/useOnScrollEnd';
import useNavigate from '../../hooks/drive/useNavigate';
import useDrive from '../../hooks/drive/useDrive';
import EmptyFolder from '../FileBrowser/EmptyFolder';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import { DriveFolder } from './DriveFolderProvider';
import { useDriveContent } from './DriveContentProvider';
import { FileBrowserItem } from '../FileBrowser/interfaces';
import useDriveDragMove from '../../hooks/drive/useDriveDragMove';
import FileBrowser from '../FileBrowser/FileBrowser';
import useUserSettings from '../../hooks/drive/useUserSettings';

interface Props {
    activeFolder: DriveFolder;
}

function Drive({ activeFolder }: Props) {
    const { layout } = useUserSettings();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const cache = useDriveCache();
    const { getLinkMeta } = useDrive();
    const { navigateToLink } = useNavigate();
    const {
        loadNextPage,
        fileBrowserControls,
        loading,
        contents,
        complete,
        sortParams,
        setSorting,
    } = useDriveContent();

    const { linkId, shareId } = activeFolder;
    const {
        clearSelections,
        selectedItems,
        toggleSelectItem,
        toggleAllSelected,
        toggleRange,
        selectItem,
    } = fileBrowserControls;

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
    }, [complete, loadNextPage, layout, shareId, linkId, sortParams]);

    // On content change, check scroll end (does not rebind listeners)
    useOnScrollEnd(handleScrollEnd, scrollAreaRef, 0.9, [contents, layout]);

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
            layout={layout}
            scrollAreaRef={scrollAreaRef}
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
        />
    );
}

export default Drive;
