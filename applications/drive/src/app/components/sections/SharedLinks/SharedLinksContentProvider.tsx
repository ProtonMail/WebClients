import { useState, createContext, useEffect, useContext, useRef, useCallback } from 'react';
import * as React from 'react';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { SharedLinksSectionSortKeys, SortParams } from '@proton/shared/lib/interfaces/drive/link';
import { DEFAULT_SORT_PARAMS_SHARED_LINKS } from '@proton/shared/lib/drive/constants';

import useSelection from '../../../hooks/util/useSelection';
import useSharing from '../../../hooks/drive/useSharing';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import { mapLinksToChildren } from '../helpers';
import useDriveSorting from '../../../hooks/drive/useDriveSorting';

interface SharedLinksContentProviderState {
    contents: FileBrowserItem[];
    sortParams: SortParams<SharedLinksSectionSortKeys>;
    setSorting: (sortParams: SortParams<SharedLinksSectionSortKeys>) => void;
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
    const [sorting, setSorting] = useState(DEFAULT_SORT_PARAMS_SHARED_LINKS);

    const {
        sortParams,
        sortedList,
        setSorting: handleSortingChange,
    } = useDriveSorting(
        () => {
            return cache.get.sharedLinkMetas(shareId).filter((meta) => !cache.get.areAncestorsTrashed(shareId, meta));
        },
        sorting,
        async (sortParams: SortParams<SharedLinksSectionSortKeys>) => {
            setSorting(sortParams);
        }
    );

    const contents = mapLinksToChildren(sortedList, (linkId) => cache.get.isLinkLocked(shareId, linkId));
    const complete = cache.get.sharedLinksComplete(shareId);

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
        } catch (e: any) {
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

        if (!initialized || !sortedList.length) {
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
                setSorting: handleSortingChange,
                sortParams,
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
