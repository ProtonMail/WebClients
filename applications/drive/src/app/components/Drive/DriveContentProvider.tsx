import React, { useState, createContext, useEffect, useContext, useRef, useCallback } from 'react';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import useFileBrowser from '../FileBrowser/useFileBrowser';
import useDrive from '../../hooks/drive/useDrive';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import { DriveFolder, useDriveActiveFolder } from './DriveFolderProvider';
import { mapLinksToChildren } from './helpers';
import { SortKeys } from '../../interfaces/link';
import useDriveSorting from '../../hooks/drive/useDriveSorting';
import { FileBrowserItem } from '../FileBrowser/interfaces';

interface DriveContentProviderState {
    contents: FileBrowserItem[];
    loadNextPage: () => void;
    setSorting: (sortField: SortKeys, sortOrder: SORT_DIRECTION) => void;
    sortParams: { sortField: SortKeys; sortOrder: SORT_DIRECTION };
    fileBrowserControls: ReturnType<typeof useFileBrowser>;
    loading: boolean;
    initialized: boolean;
    complete?: boolean;
}

const DriveContentContext = createContext<DriveContentProviderState | null>(null);

const DriveContentProviderInner = ({
    children,
    activeFolder: { linkId, shareId },
}: {
    children: React.ReactNode;
    activeFolder: DriveFolder;
}) => {
    const cache = useDriveCache();
    const { fetchNextFolderContents } = useDrive();
    const [initialized, setInitialized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [, setError] = useState();

    const { sortParams, sortedList, setSorting } = useDriveSorting(
        (sortParams) => cache.get.childLinkMetas(shareId, linkId, sortParams) || []
    );
    const contents = mapLinksToChildren(sortedList);
    const complete = cache.get.childrenComplete(shareId, linkId, sortParams);

    const fileBrowserControls = useFileBrowser(contents);
    const abortSignal = useRef<AbortSignal>();
    const contentLoading = useRef(false);

    const loadNextPage = useCallback(async (): Promise<void> => {
        if (contentLoading.current || complete) {
            return;
        }

        contentLoading.current = true;
        setLoading(true);

        const signal = abortSignal.current;

        try {
            await fetchNextFolderContents(shareId, linkId, sortParams);
            if (!signal?.aborted) {
                contentLoading.current = false;
                setLoading(false);
                setInitialized(true);
            }
        } catch (e) {
            const children = cache.get.childLinks(shareId, linkId, sortParams);

            if (signal?.aborted) {
                return;
            }

            contentLoading.current = false;
            if (!children?.length) {
                setError(() => {
                    throw e;
                });
            } else if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [shareId, linkId, sortParams]);

    useEffect(() => {
        const abortController = new AbortController();

        abortSignal.current = abortController.signal;
        fileBrowserControls.clearSelections();

        if (loading) {
            setLoading(false);
        }

        if (!initialized || !cache.get.listedChildLinks(shareId, linkId)?.length) {
            loadNextPage().catch(console.error);
        }

        return () => {
            contentLoading.current = false;
            abortController.abort();
        };
    }, [loadNextPage]);

    return (
        <DriveContentContext.Provider
            value={{
                loading,
                fileBrowserControls,
                loadNextPage,
                setSorting,
                sortParams,
                contents,
                complete,
                initialized,
            }}
        >
            {children}
        </DriveContentContext.Provider>
    );
};

/**
 * Stores loaded links as file browser content items.
 * Stores file browser controls.
 * Exposes functions to (re)load open folder contents.
 */
const DriveContentProvider = ({ children, folder }: { children: React.ReactNode; folder?: DriveFolder }) => {
    const { folder: activeFolder } = useDriveActiveFolder();

    const currentFolder = folder || activeFolder;

    return currentFolder ? (
        <DriveContentProviderInner activeFolder={currentFolder}>{children}</DriveContentProviderInner>
    ) : (
        <>{children}</>
    );
};

export const useDriveContent = () => {
    const state = useContext(DriveContentContext);
    if (!state) {
        throw new Error('Trying to use uninitialized DriveContentProvider');
    }
    return state;
};

export default DriveContentProvider;
