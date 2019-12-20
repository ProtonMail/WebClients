import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useMainArea } from 'react-components';
import { LinkType, DriveLink } from '../interfaces/folder';
import useShare from '../hooks/useShare';
import useFileBrowser from './FileBrowser/useFileBrowser';
import FileBrowser, { FileBrowserItem } from './FileBrowser/FileBrowser';
import useDownload from '../hooks/useDownload';
import DownloadsInfo from './downloads/DownloadsInfo/DownloadsInfo';
import useOnScrollEnd from '../hooks/useOnScrollEnd';
import { FOLDER_PAGE_SIZE } from '../constants';

export type DriveResource = { shareId: string; type: LinkType; linkId: string };
const mapLinksToChildren = (decryptedLinks: DriveLink[]): FileBrowserItem[] =>
    decryptedLinks.map(({ LinkID, Type, Name, Modified }) => ({
        Name,
        LinkID,
        Type,
        Modified
    }));

interface Props {
    resource: DriveResource;
    openResource: (resource: DriveResource) => void;
}

function Drive({ resource, openResource }: Props) {
    const mainAreaRef = useMainArea();
    const { getFolderContents } = useShare(resource.shareId);
    const { downloadDriveFile } = useDownload(resource.shareId);
    const [contents, setContents] = useState<FileBrowserItem[]>();
    const [loading, setLoading] = useState(false);
    const {
        clearSelections,
        selectedItems,
        selectItem,
        toggleSelectItem,
        toggleAllSelected,
        selectRange
    } = useFileBrowser(contents);

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

                setContents((prev = []) => [...prev, ...mapLinksToChildren(decryptedLinks)]);
                setLoading(false);
            }
        },
        [getFolderContents, resource.linkId]
    );

    useEffect(() => {
        if (contents) {
            setContents(undefined);
        }

        if (resource.type === LinkType.FOLDER) {
            clearSelections();
            loadNextIncrement();
        } else {
            throw Error('Files are not supported yet');
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

    const handleDoubleClick = (item: FileBrowserItem) => {
        document.getSelection()?.removeAllRanges();
        if (item.Type === LinkType.FOLDER) {
            openResource({ shareId: resource.shareId, linkId: item.LinkID, type: item.Type });
        } else if (item.Type === LinkType.FILE) {
            downloadDriveFile(item.LinkID, item.Name);
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
            <DownloadsInfo />
        </>
    );
}

export default Drive;
