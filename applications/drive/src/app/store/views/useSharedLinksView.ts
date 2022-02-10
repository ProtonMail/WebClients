import { useEffect, useMemo } from 'react';

import { useLoading } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { SharedLinkSortField } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useUserSettings } from '../settings';
import { useLinksListing } from '../links';
import { useMemoArrayNoMatterTheOrder, useAbortSignal, useSelection, useSortingWithDefault } from './utils';

const DEFAULT_SORT = {
    sortField: 'name' as SharedLinkSortField,
    sortOrder: SORT_DIRECTION.ASC,
};

/**
 * useSharedLinksView provides data for shared links by URL view (file browser of shared links).
 */
export default function useSharedLinksView(shareId: string) {
    const abortSignal = useAbortSignal([shareId]);

    const [isLoading, withLoading] = useLoading(true);

    const linksListing = useLinksListing();
    const [sharedLinks, isDecrypting] = linksListing.getCachedSharedByLink(abortSignal, shareId);
    const cachedSharedLinks = useMemoArrayNoMatterTheOrder(sharedLinks);

    const { layout } = useUserSettings();
    const { sortedList, sortParams, setSorting } = useSortingWithDefault(cachedSharedLinks, DEFAULT_SORT);

    const sortedListForSelection = useMemo(() => {
        return sortedList.map((item) => ({
            id: item.linkId,
            disabled: item.isLocked,
            data: item,
        }));
    }, [sortedList]);
    const selectionControls = useSelection(sortedListForSelection);

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(linksListing.loadLinksSharedByLink(ac.signal, shareId));
        return () => {
            ac.abort();
        };
    }, [shareId]);

    return {
        layout,
        items: sortedList,
        sortParams,
        setSorting,
        selectionControls,
        isLoading: isLoading || isDecrypting,
    };
}
