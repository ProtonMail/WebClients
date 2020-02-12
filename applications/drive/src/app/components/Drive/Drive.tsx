import React, { useCallback } from 'react';
import { useMainArea } from 'react-components';
import { ResourceType } from '../../interfaces/folder';
import useFiles from '../../hooks/useFiles';
import useOnScrollEnd from '../../hooks/useOnScrollEnd';
import { FOLDER_PAGE_SIZE } from '../../constants';
import FileBrowser, { FileBrowserItem } from '../FileBrowser/FileBrowser';
import { DriveResource } from './DriveResourceProvider';
import { TransferMeta } from '../../interfaces/transfer';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { isPreviewAvailable } from '../FilePreview/FilePreview';
import { DriveFile } from '../../interfaces/file';
import { useDriveContent } from './DriveContentProvider';
import EmptyFolder from '../FileBrowser/EmptyFolder';

export const getMetaForTransfer = (item: FileBrowserItem | DriveFile): TransferMeta => {
    return {
        filename: item.Name,
        mimeType: item.MimeType,
        size: 'ActiveRevision' in item ? item.ActiveRevision.Size : item.Size
    };
};

interface Props {
    resource: DriveResource;
    openResource: (resource: DriveResource, item?: FileBrowserItem) => void;
}

function Drive({ resource, openResource }: Props) {
    const mainAreaRef = useMainArea();
    const { startFileTransfer } = useFiles(resource.shareId);
    const { addToLoadQueue, fileBrowserControls, loading, contents } = useDriveContent();

    const {
        clearSelections,
        selectedItems,
        selectItem,
        toggleSelectItem,
        toggleAllSelected,
        selectRange
    } = fileBrowserControls;

    const handleScrollEnd = useCallback(() => {
        if (loading || contents.done) {
            return;
        }
        const loadedCount = contents.items.length;
        const page = loadedCount / FOLDER_PAGE_SIZE;
        addToLoadQueue(resource, page);
    }, [contents, loading]);

    useOnScrollEnd(handleScrollEnd, mainAreaRef, 0.9);

    const handleDoubleClick = async (item: FileBrowserItem) => {
        document.getSelection()?.removeAllRanges();
        const driveResource = { shareId: resource.shareId, linkId: item.LinkID, type: item.Type };
        if (item.Type === ResourceType.FOLDER) {
            openResource(driveResource, item);
        } else if (item.Type === ResourceType.FILE) {
            if (item.MimeType && isPreviewAvailable(item.MimeType)) {
                openResource(driveResource, item);
            } else {
                const meta = getMetaForTransfer(item);
                const fileStream = await startFileTransfer(item.LinkID, meta);
                FileSaver.saveViaDownload(fileStream, meta);
            }
        }
    };

    return contents.done && !contents.items.length && !loading ? (
        <EmptyFolder />
    ) : (
        <FileBrowser
            loading={loading}
            contents={contents.items}
            selectedItems={selectedItems}
            onItemClick={selectItem}
            onToggleItemSelected={toggleSelectItem}
            onItemDoubleClick={handleDoubleClick}
            onEmptyAreaClick={clearSelections}
            onToggleAllSelected={toggleAllSelected}
            onShiftClick={selectRange}
        />
    );
}

export default Drive;
