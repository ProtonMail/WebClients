import { useCallback, useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { sendErrorReport } from '../../utils/errorHandling';
import { DecryptedLinkWithShareInfo, useLinksListing } from '../_links';
import { useUserSettings } from '../_settings';
import { useDirectSharingInfo } from '../_shares/useDirectSharingInfo';
import { useAbortSignal, useMemoArrayNoMatterTheOrder, useSortingWithDefault } from './utils';
import { SortField } from './utils/useSorting';

const DEFAULT_SORT = {
    sortField: 'name' as SortField,
    sortOrder: SORT_DIRECTION.ASC,
};

/**
 * useSharedWithMeView provides data for shared with me links view (file browser of shared links).
 */
export default function useSharedWithMeView(shareId: string) {
    const abortSignal = useAbortSignal([shareId]);
    const [isLoading, withLoading] = useLoading(true);
    const [linksWithShareInfo, setLinksWithShareInfo] = useState<DecryptedLinkWithShareInfo[]>([]);
    const { getDirectSharingInfo } = useDirectSharingInfo();

    const linksListing = useLinksListing();
    const { links: sharedLinks, isDecrypting } = linksListing.getCachedSharedWithMeLink(abortSignal);

    const cachedSharedLinks = useMemoArrayNoMatterTheOrder(sharedLinks);

    const { layout } = useUserSettings();
    const { sortedList, sortParams, setSorting } = useSortingWithDefault(cachedSharedLinks, DEFAULT_SORT);

    const loadSharedWithMeLinks = async (signal: AbortSignal) => {
        await linksListing.loadLinksSharedWithMeLink(signal);
    };

    const loadLinksShareInfo = useCallback(
        async (signal: AbortSignal) => {
            const links = await Promise.all(
                sortedList.map(async (link) => {
                    const directSharingInfo = await getDirectSharingInfo(signal, link.rootShareId);
                    if (!directSharingInfo) {
                        return link;
                    }
                    return { ...link, ...directSharingInfo };
                })
            );
            setLinksWithShareInfo(links);
        },
        [sortedList, getDirectSharingInfo]
    );

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(
            loadSharedWithMeLinks(ac.signal)
                .then(() => loadLinksShareInfo(ac.signal))
                .catch(sendErrorReport)
        );
        return () => {
            ac.abort();
        };
    }, [shareId, loadLinksShareInfo]);

    return {
        layout,
        items: linksWithShareInfo,
        sortParams,
        setSorting,
        isLoading: isLoading || isDecrypting,
    };
}
