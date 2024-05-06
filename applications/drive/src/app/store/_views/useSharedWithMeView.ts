import { useCallback, useEffect } from 'react';

import { useLoading } from '@proton/hooks';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { sendErrorReport } from '../../utils/errorHandling';
import { useLinksListing } from '../_links';
import { useUserSettings } from '../_settings';
import { useLoadLinksShareInfo } from '../_shares/useLoadLinksShareInfo';
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
    const linksListing = useLinksListing();

    const loadSharedWithMeLinks = useCallback(async (signal: AbortSignal) => {
        await linksListing.loadLinksSharedWithMeLink(signal);
    }, []); //TODO: No deps params as too much work needed in linksListing

    const abortSignal = useAbortSignal([shareId, withLoading, loadSharedWithMeLinks]);
    const { links: sharedLinks, isDecrypting } = linksListing.getCachedSharedWithMeLink(abortSignal);

    const cachedSharedLinks = useMemoArrayNoMatterTheOrder(sharedLinks);

    const { layout } = useUserSettings();

    const { isLoading: isShareInfoLoading, linksWithShareInfo } = useLoadLinksShareInfo({
        shareId,
        links: cachedSharedLinks,
    });
    const { sortedList, sortParams, setSorting } = useSortingWithDefault(linksWithShareInfo, DEFAULT_SORT);

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
