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
    const [isLoading, withLoading] = useLoading(true);
    const [isShareInfoLoading, withShareInfoLoading] = useLoading(true);
    const [linksWithShareInfo, setLinksWithShareInfo] = useState<Map<string, DecryptedLinkWithShareInfo>>(new Map());
    const { getDirectSharingInfo } = useDirectSharingInfo();
    const linksListing = useLinksListing();

    const loadSharedWithMeLinks = useCallback(async (signal: AbortSignal) => {
        await linksListing.loadLinksSharedWithMeLink(signal);
    }, []); //TODO: No deps params as too much work needed in linksListing

    const abortSignal = useAbortSignal([shareId, withLoading, loadSharedWithMeLinks]);
    const { links: sharedLinks, isDecrypting } = linksListing.getCachedSharedWithMeLink(abortSignal);

    const cachedSharedLinks = useMemoArrayNoMatterTheOrder(sharedLinks);

    const { layout } = useUserSettings();
    const { sortedList, sortParams, setSorting } = useSortingWithDefault(
        [...linksWithShareInfo.values()],
        DEFAULT_SORT
    );

    const loadLinksShareInfo = useCallback(
        async (signal: AbortSignal) => {
            return Promise.all(
                cachedSharedLinks.map(async (link) => {
                    const directSharingInfo = await getDirectSharingInfo(signal, link.rootShareId);
                    if (!directSharingInfo) {
                        setLinksWithShareInfo((prevMap) => {
                            return new Map(prevMap).set(link.linkId, link);
                        });
                    } else {
                        setLinksWithShareInfo((prevMap) => {
                            return new Map(prevMap).set(link.linkId, { ...link, ...directSharingInfo });
                        });
                    }
                })
            );
        },
        [cachedSharedLinks]
    );

    useEffect(() => {
        void withShareInfoLoading(loadLinksShareInfo(abortSignal).catch(sendErrorReport));
    }, [isLoading, withShareInfoLoading, loadLinksShareInfo, abortSignal]);

    useEffect(() => {
        void withLoading(loadSharedWithMeLinks(abortSignal).catch(sendErrorReport));
    }, [shareId, withLoading, loadSharedWithMeLinks, abortSignal]);

    return {
        layout,
        items: sortedList,
        sortParams,
        setSorting,
        isLoading: isLoading || isDecrypting || isShareInfoLoading,
    };
}
