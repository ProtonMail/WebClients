import React, { useState, createContext, useEffect, useContext, useRef } from 'react';
import { ResourceType, LinkShortMeta } from '../../interfaces/link';
import { FileBrowserItem } from '../FileBrowser/FileBrowser';
import useShare from '../../hooks/useShare';
import { DriveResource, useDriveResource } from './DriveResourceProvider';
import useFileBrowser from '../FileBrowser/useFileBrowser';
import { FOLDER_PAGE_SIZE } from '../../constants';
import { useUploadProvider } from '../uploads/UploadProvider';
import { TransferState } from '../../interfaces/transfer';

const isSameResource = (a: DriveResource, b: DriveResource) =>
    a.type === b.type && a.shareId === b.shareId && a.linkId === b.linkId;

export const mapLinksToChildren = (decryptedLinks: LinkShortMeta[]): FileBrowserItem[] =>
    decryptedLinks.map(({ LinkID, Type, Name, Modified, Size, MimeType, ParentLinkID }) => ({
        Name,
        LinkID,
        Type,
        Modified,
        Size,
        MimeType,
        ParentLinkID
    }));

interface DriveContentProviderState {
    contents: { done: boolean; items: FileBrowserItem[] };
    addToLoadQueue: (resource: DriveResource, page?: number) => void;
    fileBrowserControls: ReturnType<typeof useFileBrowser>;
    loading: boolean;
}

const DriveContentContext = createContext<DriveContentProviderState | null>(null);

const DriveContentProviderInner = ({ children, resource }: { children: React.ReactNode; resource: DriveResource }) => {
    const { uploads } = useUploadProvider();
    const { getFolderContents } = useShare(resource.shareId);
    const [loading, setLoading] = useState(false);
    const [loadQueue, setLoadQueue] = useState<{ page: number }[]>([]);
    const [contents, setContents] = useState<{ done: boolean; items: FileBrowserItem[][] }>({
        items: [],
        done: false
    });
    const fileBrowserControls = useFileBrowser(contents.items.flat());
    const { clearSelections } = fileBrowserControls;
    const abortSignal = useRef<AbortSignal>();

    const uploadedCount = uploads.filter(
        ({ state, info }) =>
            state === TransferState.Done && info?.ParentLinkID === resource.linkId && info?.ShareID === resource.shareId
    ).length;

    const loadNextInQueue = async (): Promise<void> => {
        const signal = abortSignal.current;
        const [next, ...remainingQueue] = loadQueue;

        if (!next) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setLoadQueue(remainingQueue);
        const decryptedLinks = await getFolderContents(resource.linkId, next.page, FOLDER_PAGE_SIZE);

        if (!signal?.aborted) {
            const links = mapLinksToChildren(decryptedLinks);

            // refreshes the page and discards all next pages (may be outdated)
            setContents((prev) => ({
                done: decryptedLinks.length !== FOLDER_PAGE_SIZE,
                items: [...prev.items.slice(0, next.page), links]
            }));
            setLoading(false);
        }
    };

    const addToLoadQueue = (forResource: DriveResource, page = 0) => {
        const alreadyInQueue = loadQueue.find((item) => item.page === page);

        if (isSameResource(forResource, resource) && !alreadyInQueue) {
            setLoadQueue((queue) => [...queue, { page }]);
        }
    };

    useEffect(() => {
        if (!loading && loadQueue.length) {
            loadNextInQueue();
        }
    }, [loading, loadQueue]);

    useEffect(() => {
        const abortController = new AbortController();

        if (resource.type === ResourceType.FOLDER) {
            if (contents) {
                setContents({ done: false, items: [] });
            }
            setLoadQueue([]);
            setLoading(false);
            clearSelections();
            abortSignal.current = abortController.signal;
        }
        return () => {
            abortController.abort();
        };
    }, [resource.shareId, resource.type, resource.linkId]);

    useEffect(() => {
        // Reload all folder contents after upload
        if (uploadedCount) {
            addToLoadQueue(resource);
        }
    }, [uploadedCount]);

    return (
        <DriveContentContext.Provider
            value={{
                loading,
                fileBrowserControls,
                addToLoadQueue,
                contents: {
                    done: contents.done,
                    items: contents.items.flat()
                }
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
