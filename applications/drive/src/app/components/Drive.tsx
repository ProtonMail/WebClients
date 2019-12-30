import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useMainArea } from 'react-components';
import { LinkType, DriveLink } from '../interfaces/folder';
import useShare from '../hooks/useShare';
import useFiles from '../hooks/useFiles';
import useOnScrollEnd from '../hooks/useOnScrollEnd';
import { FOLDER_PAGE_SIZE } from '../constants';
import useFileBrowser from './FileBrowser/useFileBrowser';
import FileBrowser, { FileBrowserItem } from './FileBrowser/FileBrowser';
import { DriveResource } from './DriveResourceProvider';
import { useUploadProvider, UploadState } from './uploads/UploadProvider';
import TransfersInfo from './TransfersInfo/TransfersInfo';

const mapLinksToChildren = (decryptedLinks: DriveLink[]): FileBrowserItem[] =>
    decryptedLinks.map(({ LinkID, Type, Name, Modified, Size }) => ({
        Name,
        LinkID,
        Type,
        Modified,
        Size
    }));

interface Props {
    resource: DriveResource;
    openResource: (resource: DriveResource) => void;
}

function Drive({ resource, openResource }: Props) {
    const mainAreaRef = useMainArea();
    const { getFolderContents } = useShare(resource.shareId);
    const { downloadDriveFile } = useFiles(resource.shareId);
    const { uploads } = useUploadProvider();
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
        async (page = 0, isReload = false) => {
            if (loadingPage.current !== null || isDoneLoading.current) {
                return;
            }

            setLoading(true);
            loadingPage.current = page;
            const decryptedLinks = await getFolderContents(resource.linkId, page, FOLDER_PAGE_SIZE, isReload);

            // If resource changed while loading contents discard the result
            if (loadingPage.current === page) {
                // eslint-disable-next-line require-atomic-updates
                loadingPage.current = null;

                // eslint-disable-next-line require-atomic-updates
                isDoneLoading.current = decryptedLinks.length !== FOLDER_PAGE_SIZE;

                setContents((prev = []) =>
                    isReload ? mapLinksToChildren(decryptedLinks) : [...prev, ...mapLinksToChildren(decryptedLinks)]
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

    const uploadedCount = uploads.filter(
        ({ state, info }) =>
            state === UploadState.Done && info.linkId === resource.linkId && info.shareId === resource.shareId
    ).length;

    useEffect(() => {
        if (uploadedCount) {
            loadNextIncrement(0, true);
        }

        return () => {
            isDoneLoading.current = false;
            loadingPage.current = null;
        };
    }, [uploadedCount]);

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
            <TransfersInfo />
        </>
    );
}

export default Drive;
