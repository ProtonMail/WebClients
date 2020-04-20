import React, { useCallback } from 'react';
import { useMainArea } from 'react-components';
import useFiles from '../../hooks/useFiles';
import useOnScrollEnd from '../../hooks/useOnScrollEnd';
import FileBrowser, { FileBrowserItem } from '../FileBrowser/FileBrowser';
import { DriveFolder } from './DriveFolderProvider';
import { TransferMeta } from '../../interfaces/transfer';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { isPreviewAvailable } from '../FilePreview/FilePreview';
import { useDriveContent } from './DriveContentProvider';
import EmptyFolder from '../FileBrowser/EmptyFolder';
import { LinkMeta, LinkType } from '../../interfaces/link';

export const getMetaForTransfer = (item: FileBrowserItem | LinkMeta): TransferMeta => {
    return {
        filename: item.Name,
        mimeType: item.MimeType,
        size: item.Size
    };
};

interface Props {
    activeFolder: DriveFolder;
    openLink: (shareId: string, linkId: string, type: LinkType) => void;
}

function Drive({ activeFolder, openLink }: Props) {
    const mainAreaRef = useMainArea();
    const { startFileTransfer } = useFiles();
    const { loadNextPage, fileBrowserControls, loading, contents, complete, initialized } = useDriveContent();

    const { clearSelections, selectedItems, toggleSelectItem, toggleAllSelected, selectRange } = fileBrowserControls;

    const handleScrollEnd = useCallback(() => {
        // Only load on scroll after initial load from backend
        if (initialized && !complete) {
            loadNextPage();
        }
    }, [initialized, complete, loadNextPage]);

    // On content change, check scroll end (does not rebind listeners)
    useOnScrollEnd(handleScrollEnd, mainAreaRef, 0.9, [contents]);

    const handleClick = async (item: FileBrowserItem) => {
        document.getSelection()?.removeAllRanges();
        const { shareId } = activeFolder;

        if (item.Type === LinkType.FOLDER) {
            openLink(shareId, item.LinkID, item.Type);
        } else if (item.Type === LinkType.FILE) {
            if (item.MimeType && isPreviewAvailable(item.MimeType)) {
                openLink(shareId, item.LinkID, item.Type);
            } else {
                const meta = getMetaForTransfer(item);
                const fileStream = await startFileTransfer(shareId, item.LinkID, meta);
                FileSaver.saveViaDownload(fileStream, meta);
            }
        }
    };

    return complete && !contents.length && !loading ? (
        <EmptyFolder />
    ) : (
        <FileBrowser
            shareId={activeFolder.shareId}
            loading={loading}
            contents={contents}
            selectedItems={selectedItems}
            onItemClick={handleClick}
            onToggleItemSelected={toggleSelectItem}
            onEmptyAreaClick={clearSelections}
            onToggleAllSelected={toggleAllSelected}
            onShiftClick={selectRange}
        />
    );
}

export default Drive;
