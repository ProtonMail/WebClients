import { useEffect, useRef } from 'react';

import useLoading from '@proton/hooks/useLoading';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { sendErrorReport } from '../../utils/errorHandling';
import useLinksListing from '../_links/useLinksListing/useLinksListing';
import useDefaultShare from '../_shares/useDefaultShare';
import { useMemoArrayNoMatterTheOrder } from './utils/objectId';
import useAbortSignal from './utils/useAbortSignal';
import { useSortingWithDefault } from './utils/useSorting';
import type { SortField } from './utils/useSorting';

const DEFAULT_SORT = {
    sortField: 'name' as SortField,
    sortOrder: SORT_DIRECTION.ASC,
};

/**
 * useTrashView provides data for trash view (file browser of trash).
 */
export default function useTrashView() {
    const abortSignal = useAbortSignal();
    const { getDefaultShare, getDefaultPhotosShare } = useDefaultShare();
    const [isLoading, withLoading] = useLoading(true);
    const volumeIds = useRef<string[]>();

    const linksListing = useLinksListing();
    const { links: trashedLinks, isDecrypting } = linksListing.getCachedTrashed(abortSignal, volumeIds.current);
    const cachedTrashedLinks = useMemoArrayNoMatterTheOrder(trashedLinks);

    const { sortedList } = useSortingWithDefault(cachedTrashedLinks, DEFAULT_SORT);

    const loadTrashListing = async (signal: AbortSignal) => {
        const defaultShare = await getDefaultShare(signal);
        const photosShare = await getDefaultPhotosShare(signal);
        // New photos share is on different volume, but as we need to support both for now we need this condition
        const haveDifferentVolumeId = photosShare && defaultShare.volumeId !== photosShare.volumeId;
        volumeIds.current = haveDifferentVolumeId
            ? [defaultShare.volumeId, photosShare.volumeId]
            : [defaultShare.volumeId];
        await Promise.all([
            linksListing.loadTrashedLinks(signal, defaultShare.volumeId),
            haveDifferentVolumeId ? linksListing.loadTrashedLinks(signal, photosShare.volumeId) : undefined,
        ]);
    };

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(loadTrashListing(ac.signal)).catch(sendErrorReport);
        return () => {
            ac.abort();
        };
    }, []);

    return {
        items: sortedList,
        isLoading: isLoading || isDecrypting,
    };
}
