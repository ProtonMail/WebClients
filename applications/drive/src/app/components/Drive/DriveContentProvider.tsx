import React, { useState, createContext, useEffect, useContext, useRef, useCallback } from 'react';
import { LinkMeta } from '../../interfaces/link';
import { FileBrowserItem } from '../FileBrowser/FileBrowser';
import useFileBrowser from '../FileBrowser/useFileBrowser';
import useDrive from '../../hooks/useDrive';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import { useDriveActiveFolder, DriveFolder } from './DriveFolderProvider';

export const mapLinksToChildren = (decryptedLinks: LinkMeta[]): FileBrowserItem[] => {
    return decryptedLinks.map(({ LinkID, Type, Name, Modified, Size, MimeType, ParentLinkID }) => ({
        Name,
        LinkID,
        Type,
        Modified,
        Size,
        MimeType,
        ParentLinkID
    }));
};
interface DriveContentProviderState {
    contents: FileBrowserItem[];
    loadNextPage: () => void;
    fileBrowserControls: ReturnType<typeof useFileBrowser>;
    loading: boolean;
    initialized: boolean;
    complete?: boolean;
}

const DriveContentContext = createContext<DriveContentProviderState | null>(null);

const DriveContentProviderInner = ({
    children,
    activeFolder: { linkId, shareId }
}: {
    children: React.ReactNode;
    activeFolder: DriveFolder;
}) => {
    const cache = useDriveCache();
    const { fetchNextFolderContents } = useDrive();
    const [initialized, setInitialized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [, setError] = useState();

    const contents = mapLinksToChildren(cache.get.childLinkMetas(shareId, linkId) || []);
    const complete = cache.get.childrenComplete(shareId, linkId);
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
            await fetchNextFolderContents(shareId, linkId);
            if (!signal?.aborted) {
                contentLoading.current = false;
                setLoading(false);
                setInitialized(true);
            }
        } catch (e) {
            const children = cache.get.childLinks(shareId, linkId);

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
    }, [shareId, linkId]);

    useEffect(() => {
        const abortController = new AbortController();

        abortSignal.current = abortController.signal;
        fileBrowserControls.clearSelections();

        if (loading) {
            setLoading(false);
        }

        if (!initialized || !cache.get.listedChildLinks(shareId, linkId)?.length) {
            loadNextPage();
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
                contents,
                complete,
                initialized
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
const DriveContentProvider = ({ children }: { children: React.ReactNode }) => {
    const { folder } = useDriveActiveFolder();

    return folder ? (
        <DriveContentProviderInner activeFolder={folder}>{children}</DriveContentProviderInner>
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
