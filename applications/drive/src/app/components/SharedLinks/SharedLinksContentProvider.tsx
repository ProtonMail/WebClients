import React, { useState, createContext, useEffect, useContext, useRef, useCallback } from 'react';
import { FileBrowserItem } from '../FileBrowser/interfaces';
import useSelection from '../../hooks/util/useSelection';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import useSharing from '../../hooks/drive/useSharing';
import { mapLinksToChildren } from '../Drive/helpers';

interface SharedLinksContentProviderState {
    contents: FileBrowserItem[];
    loadNextPage: () => void;
    fileBrowserControls: Omit<ReturnType<typeof useSelection>, 'selectedItems'> & {
        selectedItems: FileBrowserItem[];
    };
    loading: boolean;
    initialized: boolean;
    complete?: boolean;
}

const SharedLinksContentContext = createContext<SharedLinksContentProviderState | null>(null);

const SharedLinksContentProvider = ({ children, shareId }: { children: React.ReactNode; shareId: string }) => {
    const cache = useDriveCache();
    const { fetchNextPage } = useSharing();
    const [initialized, setInitialized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [, setError] = useState();

    const sharedLinks = cache.get
        .sharedLinkMetas(shareId)
        .filter((meta) => !cache.get.areAncestorsTrashed(shareId, meta));
    const complete = cache.get.sharedLinksComplete(shareId);
    const contents = mapLinksToChildren(sharedLinks, (linkId) => cache.get.isLinkLocked(shareId, linkId));

    const selectionControls = useSelection(
        contents.map((data) => ({
            id: data.LinkID,
            disabled: data.Disabled,
            data,
        }))
    );
    const fileBrowserControls = {
        ...selectionControls,
        selectedItems: selectionControls.selectedItems.map(({ data }) => data),
    };
    const abortSignal = useRef<AbortSignal>();
    const contentLoading = useRef(false);

    const loadNextPage = useCallback(async () => {
        if (contentLoading.current || complete) {
            return;
        }

        contentLoading.current = true;
        setLoading(true);

        const signal = abortSignal.current;

        try {
            await fetchNextPage(shareId);
            if (!signal?.aborted) {
                contentLoading.current = false;
                setLoading(false);
                setInitialized(true);
            }
        } catch (e) {
            const children = cache.get.sharedLinkMetas(shareId);

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
    }, [shareId]);

    useEffect(() => {
        const abortController = new AbortController();

        abortSignal.current = abortController.signal;
        fileBrowserControls.clearSelections();

        if (loading) {
            setLoading(false);
        }

        if (!initialized || !sharedLinks.length) {
            loadNextPage().catch(console.error);
        }

        return () => {
            contentLoading.current = false;
            abortController.abort();
        };
    }, [loadNextPage]);

    return (
        <SharedLinksContentContext.Provider
            value={{
                loading,
                fileBrowserControls,
                loadNextPage,
                contents,
                complete,
                initialized,
            }}
        >
            {children}
        </SharedLinksContentContext.Provider>
    );
};
export const useSharedLinksContent = () => {
    const state = useContext(SharedLinksContentContext);
    if (!state) {
        throw new Error('Trying to use uninitialized SharedLinksContentProvider');
    }
    return state;
};

export default SharedLinksContentProvider;
