import React, { useState, createContext, useEffect, useContext, useRef, useCallback } from 'react';
import { useSortedList } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import useSelection from '../../../hooks/util/useSelection';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import useTrash from '../../../hooks/drive/useTrash';
import { mapLinksToChildren } from '../helpers';
import { FileBrowserItem } from '../../FileBrowser/interfaces';

interface TrashContentProviderState {
    contents: FileBrowserItem[];
    loadNextPage: () => void;
    fileBrowserControls: Omit<ReturnType<typeof useSelection>, 'selectedItems'> & {
        selectedItems: FileBrowserItem[];
    };
    loading: boolean;
    initialized: boolean;
    complete?: boolean;
}

const TrashContentContext = createContext<TrashContentProviderState | null>(null);

/**
 * Stores loaded trash as file browser content items.
 * Stores file browser controls.
 * Exposes functions to (re)load trash contents.
 */
const TrashContentProvider = ({ children, shareId }: { children: React.ReactNode; shareId: string }) => {
    const cache = useDriveCache();
    const { fetchNextPage } = useTrash();
    const [initialized, setInitialized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [, setError] = useState();

    const trashLinks = cache.get.trashMetas(shareId);
    const complete = cache.get.trashComplete(shareId);
    const { sortedList } = useSortedList(
        mapLinksToChildren(trashLinks, (linkId) => cache.get.isLinkLocked(shareId, linkId)),
        {
            key: 'ModifyTime',
            direction: SORT_DIRECTION.ASC,
        }
    );
    const selectionControls = useSelection(
        sortedList.map((data) => ({
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
            const children = cache.get.trashMetas(shareId);

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

        if (!initialized || !trashLinks.length) {
            loadNextPage().catch(console.error);
        }

        return () => {
            contentLoading.current = false;
            abortController.abort();
        };
    }, [loadNextPage]);

    return (
        <TrashContentContext.Provider
            value={{
                loading,
                fileBrowserControls,
                loadNextPage,
                contents: sortedList,
                complete,
                initialized,
            }}
        >
            {children}
        </TrashContentContext.Provider>
    );
};
export const useTrashContent = () => {
    const state = useContext(TrashContentContext);
    if (!state) {
        throw new Error('Trying to use uninitialized TrashContentProvider');
    }
    return state;
};

export default TrashContentProvider;
