import { useEffect, useMemo } from 'react';

import { useLoading } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { TrashedLinksSortField } from '../../components/FileBrowser/interface';
import { useUserSettings } from '../_settings';
import { useLinksListing } from '../_links';
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
    const { links: trashedLinks, isDecrypting } = linksListing.getCachedTrashed(abortSignal, shareId);
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
