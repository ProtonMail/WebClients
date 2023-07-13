import { useEffect, useRef } from 'react';

import { useLoading } from '@proton/hooks';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { sendErrorReport } from '../../utils/errorHandling';
import { useLinksListing } from '../_links';
import { useUserSettings } from '../_settings';
import { useDefaultShare } from '../_shares';
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
    const { getDefaultShare } = useDefaultShare();
    const volumeId = useRef<string>();
    const [isLoading, withLoading] = useLoading(true);

    const linksListing = useLinksListing();
    const { links: sharedLinks, isDecrypting } = linksListing.getCachedSharedByLink(abortSignal, volumeId.current);
    const cachedSharedLinks = useMemoArrayNoMatterTheOrder(sharedLinks);

    const { layout } = useUserSettings();
    const { sortedList, sortParams, setSorting } = useSortingWithDefault(cachedSharedLinks, DEFAULT_SORT);

    const loadSharedLinks = async (signal: AbortSignal) => {
        const defaultShare = await getDefaultShare(signal);
        volumeId.current = defaultShare.volumeId;
        await linksListing.loadLinksSharedByLink(signal, defaultShare.volumeId);
    };

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(loadSharedLinks(ac.signal).catch(sendErrorReport));
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
