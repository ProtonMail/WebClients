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
 * useTrashView provides data for trash view (file browser of trash).
 */
export default function useTrashView() {
    const abortSignal = useAbortSignal();
    const { getDefaultShare } = useDefaultShare();
    const [isLoading, withLoading] = useLoading(true);
    const volumeId = useRef<string>();

    const linksListing = useLinksListing();
    const { links: trashedLinks, isDecrypting } = linksListing.getCachedTrashed(abortSignal, volumeId.current);
    const cachedTrashedLinks = useMemoArrayNoMatterTheOrder(trashedLinks);

    const { layout } = useUserSettings();
    const { sortedList, sortParams, setSorting } = useSortingWithDefault(cachedTrashedLinks, DEFAULT_SORT);

    const loadTrashListing = async (signal: AbortSignal) => {
        const defaultShare = await getDefaultShare(signal);
        volumeId.current = defaultShare.volumeId;
        await linksListing.loadTrashedLinks(signal, defaultShare.volumeId);
    };

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(loadTrashListing(ac.signal)).catch(sendErrorReport);
        return () => {
            ac.abort();
        };
    }, []);

    return {
        layout,
        items: sortedList,
        sortParams,
        setSorting,
        isLoading: isLoading || isDecrypting,
    };
}
