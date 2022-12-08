import { useEffect } from 'react';

import { useLoading } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { sendErrorReport } from '../../utils/errorHandling';
import { useLinksListing } from '../_links';
import { useUserSettings } from '../_settings';
import { useAbortSignal, useMemoArrayNoMatterTheOrder, useSortingWithDefault } from './utils';
import { SortField } from './utils/useSorting';

const DEFAULT_SORT = {
    sortField: 'name' as SortField,
    sortOrder: SORT_DIRECTION.ASC,
};

/**
 * useSharedLinksView provides data for shared links by URL view (file browser of shared links).
 */
export default function useSharedLinksView(shareId: string) {
    const abortSignal = useAbortSignal([shareId]);

    const [isLoading, withLoading] = useLoading(true);

    const linksListing = useLinksListing();
    const { links: sharedLinks, isDecrypting } = linksListing.getCachedSharedByLink(abortSignal, shareId);
    const cachedSharedLinks = useMemoArrayNoMatterTheOrder(sharedLinks);

    const { layout } = useUserSettings();
    const { sortedList, sortParams, setSorting } = useSortingWithDefault(cachedSharedLinks, DEFAULT_SORT);

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(linksListing.loadLinksSharedByLink(ac.signal, shareId).catch(sendErrorReport));
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
