import React, { useState, createContext, useEffect, useContext, useRef } from 'react';
import { ResourceType, LinkMeta } from '../../interfaces/link';
import { FileBrowserItem } from '../FileBrowser/FileBrowser';
import { DriveResource, useDriveResource } from './DriveResourceProvider';
import useFileBrowser from '../FileBrowser/useFileBrowser';
import useDrive from '../../hooks/useDrive';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';

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
    complete?: boolean;
}

const DriveContentContext = createContext<DriveContentProviderState | null>(null);

const DriveContentProviderInner = ({ children, resource }: { children: React.ReactNode; resource: DriveResource }) => {
    const cache = useDriveCache();
    const { fetchNextFolderContents } = useDrive();
    const [loading, setLoading] = useState(false);
    const [, setError] = useState();

    const contents = mapLinksToChildren(cache.get.childLinkMetas(resource.shareId, resource.linkId) || []);
    const complete = cache.get.childrenComplete(resource.shareId, resource.linkId);
    const fileBrowserControls = useFileBrowser(contents);
    const abortSignal = useRef<AbortSignal>();
    const contentLoading = useRef(false);

    const loadNextPage = async (): Promise<void> => {
        if (contentLoading.current || complete) {
            return;
        }

        contentLoading.current = true;
        setLoading(true);

        const signal = abortSignal.current;

        try {
            await fetchNextFolderContents(resource.shareId, resource.linkId);
            if (!signal?.aborted) {
                setLoading(false);
            }
        } catch (e) {
            const children = cache.get.childLinks(resource.shareId, resource.linkId);

            if (!children?.length) {
                setError(() => {
                    throw e;
                });
            } else if (!signal?.aborted) {
                setLoading(false);
            }
        }

        if (!signal?.aborted) {
            contentLoading.current = false;
        }
    };

    useEffect(() => {
        const abortController = new AbortController();

        if (resource.type === ResourceType.FOLDER) {
            abortSignal.current = abortController.signal;
            fileBrowserControls.clearSelections();

            if (loading) {
                setLoading(false);
            }

            loadNextPage();
        }
        return () => {
            contentLoading.current = false;
            abortController.abort();
        };
    }, [resource.shareId, resource.type, resource.linkId]);

    return (
        <DriveContentContext.Provider
            value={{
                loading,
                fileBrowserControls,
                loadNextPage,
                contents,
                complete
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
    const { resource } = useDriveResource();

    return resource ? (
        <DriveContentProviderInner resource={resource}>{children}</DriveContentProviderInner>
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
