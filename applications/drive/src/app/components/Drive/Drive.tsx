import React, { useCallback, useEffect, useRef } from 'react';

import useOnScrollEnd from '../../hooks/util/useOnScrollEnd';
import useNavigate from '../../hooks/drive/useNavigate';
import useDrive from '../../hooks/drive/useDrive';
import FileBrowser from '../FileBrowser/FileBrowser';
import EmptyFolder from '../FileBrowser/EmptyFolder';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import { DriveFolder } from './DriveFolderProvider';
import { useDriveContent } from './DriveContentProvider';
import { FileBrowserItem } from '../FileBrowser/interfaces';
import useDriveDragMove from '../../hooks/drive/useDriveDragMove';

interface Props {
    activeFolder: DriveFolder;
}

function Drive({ activeFolder }: Props) {
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
    const isInitialized = cache.get.childrenInitialized(shareId, linkId, sortParams);
    const { getDragMoveControls } = useDriveDragMove(shareId, selectedItems, clearSelections);

    useEffect(() => {
        if (folderName === undefined) {
            getLinkMeta(shareId, linkId).catch(console.error);
        }
    }, [shareId, linkId, folderName]);

    const handleScrollEnd = useCallback(() => {
        // Only load on scroll after initial load from backend
        if (isInitialized && !complete) {
            loadNextPage();
        }
    }, [complete, isInitialized, loadNextPage]);

    // On content change, check scroll end (does not rebind listeners)
    useOnScrollEnd(handleScrollEnd, scrollAreaRef, 0.9, [contents]);

    const handleClick = async (item: FileBrowserItem) => {
        document.getSelection()?.removeAllRanges();
        navigateToLink(shareId, item.LinkID, item.Type);
    };

    return complete && !contents.length && !loading ? (
        <EmptyFolder />
    ) : (
        <FileBrowser
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
