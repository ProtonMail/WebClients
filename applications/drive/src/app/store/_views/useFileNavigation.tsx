import { useEffect } from 'react';

import { useLoading } from '@proton/hooks';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { logError } from '../../utils/errorHandling';
import { useLinksListing } from '../_links';
import { usePublicLinksListingProvider } from '../_links/useLinksListing/usePublicLinksListing';
import { useUserSettings } from '../_settings';
import type { UserSortParams } from '../_settings/sorting';
import { useAbortSignal, useControlledSorting, useMemoArrayNoMatterTheOrder } from './utils';
import type { SortParams } from './utils/useSorting';

export function useFileViewNavigation(
    useNavigation: boolean,
    shareId: string,
    parentLinkId?: string,
    currentLinkId?: string
) {
    const { sort } = useUserSettings();
    const linksListing = useLinksListing();
    return useFileViewNavigationBase(useNavigation, shareId, linksListing, sort, parentLinkId, currentLinkId);
}

export function usePublicFileViewNavigation(
    useNavigation: boolean,
    shareId: string,
    sortParams: SortParams,
    parentLinkId?: string,
    currentLinkId?: string
) {
    const linksListing = usePublicLinksListingProvider();
    return useFileViewNavigationBase(useNavigation, shareId, linksListing, sortParams, parentLinkId, currentLinkId);
}

function useFileViewNavigationBase(
    useNavigation: boolean,
    shareId: string,
    linksListing: ReturnType<typeof useLinksListing | typeof usePublicLinksListingProvider>,
    sort: UserSortParams | SortParams,
    parentLinkId?: string,
    currentLinkId?: string
) {
    const [isLoading, withLoading] = useLoading(true);

    const { getCachedChildren, loadChildren } = linksListing;

    const abortSignal = useAbortSignal([shareId, parentLinkId]);
    const { links: children, isDecrypting } = parentLinkId
        ? getCachedChildren(abortSignal, shareId, parentLinkId)
        : { links: [], isDecrypting: false };
    const cachedChildren = useMemoArrayNoMatterTheOrder(children);
    const { sortedList } = useControlledSorting(useNavigation ? cachedChildren : [], sort, async () => {});
    const linksAvailableForPreview = sortedList.filter(({ mimeType, size }) => isPreviewAvailable(mimeType, size));

    useEffect(() => {
        if (!useNavigation || !parentLinkId) {
            return;
        }

        const ac = new AbortController();
        withLoading(loadChildren(ac.signal, shareId, parentLinkId)).catch(logError);
        return () => {
            ac.abort();
        };
    }, [useNavigation, parentLinkId]);

    const index = linksAvailableForPreview.findIndex(({ linkId }) => linkId === currentLinkId);

    if (!useNavigation || isLoading || isDecrypting || index === -1) {
        return;
    }

    return {
        current: index + 1,
        total: linksAvailableForPreview.length,
        nextLinkId: linksAvailableForPreview[index < linksAvailableForPreview.length ? index + 1 : 0]?.linkId,
        prevLinkId: linksAvailableForPreview[index > 0 ? index - 1 : linksAvailableForPreview.length - 1]?.linkId,
    };
}
