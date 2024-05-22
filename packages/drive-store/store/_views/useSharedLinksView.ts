import { useCallback, useEffect, useRef } from 'react';

import { useLoading } from '@proton/hooks';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { sendErrorReport } from '../../utils/errorHandling';
import { useLinksListing } from '../_links';
import { useUserSettings } from '../_settings';
import { useDefaultShare, useDriveSharingFeatureFlag } from '../_shares';
import { useLoadLinksShareInfo } from '../_shares/useLoadLinksShareInfo';
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
    const { getDefaultShare } = useDefaultShare();
    const volumeId = useRef<string>();
    const [isLoading, withLoading] = useLoading(true);
    const driveSharing = useDriveSharingFeatureFlag();
    const linksListing = useLinksListing();
    const loadSharedLinks = useCallback(
        async (signal: AbortSignal) => {
            const defaultShare = await getDefaultShare(signal);
            volumeId.current = defaultShare.volumeId;
            if (driveSharing) {
                await linksListing.loadLinksSharedByMeLink(signal, defaultShare.volumeId);
            } else {
                await linksListing.loadLinksSharedByLinkLEGACY(signal, defaultShare.volumeId);
            }
        },
        [driveSharing]
    ); //TODO: No all deps params as too much work needed in linksListing
    const abortSignal = useAbortSignal([shareId, withLoading, loadSharedLinks]);

    const { links: sharedLinks, isDecrypting } = linksListing.getCachedSharedByLink(abortSignal, volumeId.current);
    const cachedSharedLinks = useMemoArrayNoMatterTheOrder(sharedLinks);
    const { linksWithShareInfo, isLoading: isShareInfoLoading } = useLoadLinksShareInfo({
        shareId,
        links: cachedSharedLinks,
        sharedByMeListing: true,
        driveSharingFF: driveSharing,
    });

    const { layout } = useUserSettings();
    const { sortedList, sortParams, setSorting } = useSortingWithDefault(
        driveSharing ? linksWithShareInfo : cachedSharedLinks,
        DEFAULT_SORT
    );

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(loadSharedLinks(ac.signal).catch(sendErrorReport));
        return () => {
            ac.abort();
        };
    }, [shareId, loadSharedLinks, withLoading]);

    return {
        layout,
        items: sortedList,
        sortParams,
        setSorting,
        isLoading: isLoading || isDecrypting || isShareInfoLoading,
    };
}
