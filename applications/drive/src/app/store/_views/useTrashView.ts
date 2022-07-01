import { useEffect } from 'react';

import { useLoading } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { useUserSettings } from '../_settings';
import { useLinksListing } from '../_links';
import { useMemoArrayNoMatterTheOrder, useAbortSignal, useSortingWithDefault } from './utils';
import { SortField } from './utils/useSorting';

const DEFAULT_SORT = {
    sortField: 'name' as SortField,
    sortOrder: SORT_DIRECTION.ASC,
};

/**
 * useTrashView provides data for trash view (file browser of trash).
 */
export default function useTrashView(shareId: string) {
    const abortSignal = useAbortSignal([shareId]);

    const [isLoading, withLoading] = useLoading(true);

    const linksListing = useLinksListing();
    const { links: trashedLinks, isDecrypting } = linksListing.getCachedTrashed(abortSignal, shareId);
    const cachedTrashedLinks = useMemoArrayNoMatterTheOrder(trashedLinks);

    const { layout } = useUserSettings();
    const { sortedList, sortParams, setSorting } = useSortingWithDefault(cachedTrashedLinks, DEFAULT_SORT);

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
        isLoading: isLoading || isDecrypting,
    };
}
