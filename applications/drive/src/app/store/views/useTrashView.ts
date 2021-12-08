import { useEffect, useMemo } from 'react';

import { useLoading } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { TrashedLinksSortField } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useUserSettings } from '../settings';
import { useLinksListing } from '../links';
import { useMemoArrayNoMatterTheOrder, useAbortSignal, useSelection, useSortingWithDefault } from './utils';

const DEFAULT_SORT = {
    sortField: 'name' as TrashedLinksSortField,
    sortOrder: SORT_DIRECTION.ASC,
};

/**
 * useTrashView provides data for trash view (file browser of trash).
 */
export default function useTrashView(shareId: string) {
    const abortSignal = useAbortSignal([shareId]);

    const [isLoading, withLoading] = useLoading(true);

    const linksListing = useLinksListing();
    const [trashedLinks, isDecrypting] = linksListing.getCachedTrashed(abortSignal, shareId);
    const cachedTrashedLinks = useMemoArrayNoMatterTheOrder(trashedLinks);

    const { layout } = useUserSettings();
    const { sortedList, sortParams, setSorting } = useSortingWithDefault(cachedTrashedLinks, DEFAULT_SORT);

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
        void withLoading(linksListing.loadTrashedLinks(ac.signal, shareId));
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
