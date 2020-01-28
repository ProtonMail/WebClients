import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useMainArea } from 'react-components';
import { ResourceType } from '../interfaces/folder';
import useShare from '../hooks/useShare';
import useFiles from '../hooks/useFiles';
import useOnScrollEnd from '../hooks/useOnScrollEnd';
import { FOLDER_PAGE_SIZE } from '../constants';
import useFileBrowser from './FileBrowser/useFileBrowser';
import FileBrowser, { FileBrowserItem } from './FileBrowser/FileBrowser';
import { DriveResource } from './DriveResourceProvider';
import { useUploadProvider } from './uploads/UploadProvider';
import { TransferState, TransferMeta } from '../interfaces/transfer';
import FileSaver from '../utils/FileSaver/FileSaver';
import { isPreviewAvailable } from './FilePreview/FilePreview';
import { DriveLink } from '../interfaces/link';
import { DriveFile } from '../interfaces/file';

export const mapLinksToChildren = (decryptedLinks: DriveLink[]): FileBrowserItem[] =>
    decryptedLinks.map(({ LinkID, Type, Name, Modified, Size, MimeType, ParentLinkID }) => ({
        Name,
        LinkID,
        Type,
        Modified,
        Size,
        MimeType,
        ParentLinkID
    }));

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
    fileBrowserControls: ReturnType<typeof useFileBrowser>;
    contents?: FileBrowserItem[];
    setContents: React.Dispatch<React.SetStateAction<FileBrowserItem[] | undefined>>;
}

function Drive({ resource, openResource, contents, setContents, fileBrowserControls }: Props) {
    const mainAreaRef = useMainArea();
    const { getFolderContents } = useShare(resource.shareId);
    const { startFileTransfer } = useFiles(resource.shareId);
    const { uploads } = useUploadProvider();
    const [loading, setLoading] = useState(false);

    const {
        clearSelections,
        selectedItems,
        selectItem,
        toggleSelectItem,
        toggleAllSelected,
        selectRange
    } = fileBrowserControls;

    const isDoneLoading = useRef(false);
    const loadingPage = useRef<number | null>(null);

    const loadNextIncrement = useCallback(
        async (page = 0) => {
            if (loadingPage.current !== null || isDoneLoading.current) {
                return;
            }

            setLoading(true);
            loadingPage.current = page;
            const decryptedLinks = await getFolderContents(resource.linkId, page, FOLDER_PAGE_SIZE);

            // If resource changed while loading contents discard the result
            if (loadingPage.current === page) {
                // eslint-disable-next-line require-atomic-updates
                loadingPage.current = null;

                // eslint-disable-next-line require-atomic-updates
                isDoneLoading.current = decryptedLinks.length !== FOLDER_PAGE_SIZE;

                setContents((prev = []) =>
                    page === 0 ? mapLinksToChildren(decryptedLinks) : [...prev, ...mapLinksToChildren(decryptedLinks)]
                );
                setLoading(false);
            }
        },
        [getFolderContents, resource.linkId]
    );

    useEffect(() => {
        if (contents) {
            setContents(undefined);
        }

        if (resource.type === ResourceType.FOLDER) {
            clearSelections();
            loadNextIncrement();
        } else {
            throw Error('Cannot use file as a directory');
        }

        return () => {
            isDoneLoading.current = false;
            loadingPage.current = null;
        };
    }, [resource.type, loadNextIncrement]);

    const handleScrollEnd = useCallback(() => {
        const loadedCount = contents?.length ?? 0;
        const page = loadedCount / FOLDER_PAGE_SIZE;

        loadNextIncrement(page);
    }, [loadNextIncrement, contents]);

    useOnScrollEnd(handleScrollEnd, mainAreaRef);

    const uploadedCount = uploads.filter(
        ({ state, meta }) =>
            state === TransferState.Done && meta.linkId === resource.linkId && meta.shareId === resource.shareId
    ).length;

    useEffect(() => {
        // Reload all folder contents after upload
        if (uploadedCount) {
            isDoneLoading.current = false;
            loadingPage.current = null;
            loadNextIncrement(0);
        }
    }, [uploadedCount]);

    const handleDoubleClick = async (item: FileBrowserItem) => {
        document.getSelection()?.removeAllRanges();
        if (item.Type === ResourceType.FOLDER) {
            openResource({ shareId: resource.shareId, linkId: item.LinkID, type: item.Type }, item);
        } else if (item.Type === ResourceType.FILE) {
            if (item.MimeType && isPreviewAvailable(item.MimeType)) {
                openResource({ shareId: resource.shareId, linkId: item.LinkID, type: item.Type }, item);
            } else {
                const meta = getMetaForTransfer(item);
                const fileStream = await startFileTransfer(item.LinkID, meta);
                FileSaver.saveViaDownload(fileStream, meta);
            }
        }
    };

    return (
        <>
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
        </>
    );
}

export default Drive;
