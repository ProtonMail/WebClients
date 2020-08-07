import React, { useCallback, useEffect, useRef } from 'react';
import { usePreventLeave, isPreviewAvailable } from 'react-components';
import useFiles from '../../hooks/drive/useFiles';
import useOnScrollEnd from '../../hooks/util/useOnScrollEnd';
import FileBrowser from '../FileBrowser/FileBrowser';
import { DriveFolder } from './DriveFolderProvider';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { useDriveContent } from './DriveContentProvider';
import EmptyFolder from '../FileBrowser/EmptyFolder';
import { LinkType } from '../../interfaces/link';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import useDrive from '../../hooks/drive/useDrive';
import { getMetaForTransfer } from '../../utils/transfer';
import { FileBrowserItem } from '../FileBrowser/interfaces';

interface Props {
    activeFolder: DriveFolder;
    openLink: (shareId: string, linkId: string, type: LinkType) => void;
}

function Drive({ activeFolder, openLink }: Props) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const cache = useDriveCache();
    const { getLinkMeta } = useDrive();
    const { startFileTransfer } = useFiles();
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
    const { preventLeave } = usePreventLeave();

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

        if (item.Type === LinkType.FOLDER) {
            openLink(shareId, item.LinkID, item.Type);
        } else if (item.Type === LinkType.FILE) {
            if (item.MIMEType && isPreviewAvailable(item.MIMEType)) {
                openLink(shareId, item.LinkID, item.Type);
            } else {
                const meta = getMetaForTransfer(item);
                const fileStream = await startFileTransfer(shareId, item.LinkID, meta);
                preventLeave(FileSaver.saveAsFile(fileStream, meta)).catch(console.error);
            }
        }
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
