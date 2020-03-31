import React, { useCallback } from 'react';
import { useMainArea } from 'react-components';
import { ResourceType } from '../../interfaces/link';
import useFiles from '../../hooks/useFiles';
import useOnScrollEnd from '../../hooks/useOnScrollEnd';
import FileBrowser, { FileBrowserItem } from '../FileBrowser/FileBrowser';
import { DriveResource } from './DriveResourceProvider';
import { TransferMeta } from '../../interfaces/transfer';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { isPreviewAvailable } from '../FilePreview/FilePreview';
import { useDriveContent } from './DriveContentProvider';
import EmptyFolder from '../FileBrowser/EmptyFolder';
import { LinkMeta } from '../../interfaces/link';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';

export const getMetaForTransfer = (item: FileBrowserItem | LinkMeta): TransferMeta => {
    return {
        filename: item.Name,
        mimeType: item.MimeType,
        size: item.Size
    };
};

interface Props {
    resource: DriveResource;
    openResource: (resource: DriveResource, item?: FileBrowserItem) => void;
}

function Drive({ resource, openResource }: Props) {
    const mainAreaRef = useMainArea();
    const { startFileTransfer } = useFiles();
    const cache = useDriveCache();
    const { loadNextPage, fileBrowserControls, loading, contents, complete } = useDriveContent();

    const {
        clearSelections,
        selectedItems,
        selectItem,
        toggleSelectItem,
        toggleAllSelected,
        selectRange
    } = fileBrowserControls;

    const handleScrollEnd = useCallback(() => {
        const listed = cache.get.listedChildLinks(resource.shareId, resource.linkId);

        // Only load on scroll if there are already items loaded from backend
        if (listed?.length && !complete) {
            loadNextPage();
        }
    }, [contents]);

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
                const fileStream = await startFileTransfer(resource.shareId, item.LinkID, meta);
                FileSaver.saveViaDownload(fileStream, meta);
            }
        }
    };

    return complete && !contents.length && !loading ? (
        <EmptyFolder />
    ) : (
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
    );
}

export default Drive;
