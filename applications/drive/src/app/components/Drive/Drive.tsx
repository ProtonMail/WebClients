import React, { useCallback, useEffect, useRef } from 'react';
import useOnScrollEnd from '../../hooks/util/useOnScrollEnd';
import FileBrowser from '../FileBrowser/FileBrowser';
import { DriveFolder } from './DriveFolderProvider';
import { useDriveContent } from './DriveContentProvider';
import EmptyFolder from '../FileBrowser/EmptyFolder';
import { LinkType } from '../../interfaces/link';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import useDrive from '../../hooks/drive/useDrive';
import { FileBrowserItem } from '../FileBrowser/interfaces';

interface Props {
    activeFolder: DriveFolder;
    openLink: (shareId: string, linkId: string, type: LinkType) => void;
}

function Drive({ activeFolder, openLink }: Props) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const cache = useDriveCache();
    const { getLinkMeta } = useDrive();
    const {
        loadNextPage,
        fileBrowserControls,
        loading,
        contents,
        complete,
        initialized,
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

    useEffect(() => {
        if (folderName === undefined) {
            getLinkMeta(shareId, linkId).catch(console.error);
        }
    }, [shareId, linkId, folderName]);

    const handleScrollEnd = useCallback(() => {
        // Only load on scroll after initial load from backend
        if (initialized && !complete) {
            loadNextPage();
        }
    }, [initialized, complete, loadNextPage]);

    // On content change, check scroll end (does not rebind listeners)
    useOnScrollEnd(handleScrollEnd, scrollAreaRef, 0.9, [contents]);

    const handleClick = async (item: FileBrowserItem) => {
        document.getSelection()?.removeAllRanges();
        openLink(shareId, item.LinkID, item.Type);
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
        />
    );
}

export default Drive;
