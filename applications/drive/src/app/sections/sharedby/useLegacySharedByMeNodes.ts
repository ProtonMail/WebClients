import { useCallback, useEffect, useRef } from 'react';

import { useLoading } from '@proton/hooks';

import { useLinksListing } from '../../store/_links';
import { useDefaultShare } from '../../store/_shares';
import { useAbortSignal, useMemoArrayNoMatterTheOrder } from '../../store/_views/utils';
import { sendErrorReport } from '../../utils/errorHandling';

/**
 * useLegacySharedByMePhotosView provides data for shared by me photos/albums links
 */
export function useLegacySharedByMeNodes() {
    const { getDefaultPhotosShare } = useDefaultShare();
    const photoVolumeId = useRef<string>();
    const [isLoading, withLoading] = useLoading(true);
    const linksListing = useLinksListing();
    const loadSharedLinks = useCallback(async (signal: AbortSignal) => {
        const defaultPhotoShare = await getDefaultPhotosShare(signal);
        if (!defaultPhotoShare) {
            return;
        }
        photoVolumeId.current = defaultPhotoShare?.volumeId;
        await linksListing.loadLinksSharedByMeLink(signal, defaultPhotoShare.volumeId);
    }, []); //TODO: No all deps params as too much work needed in linksListing
    const abortSignal = useAbortSignal([withLoading, loadSharedLinks]);

    const { links, isDecrypting } = linksListing.getCachedSharedByLink(abortSignal, photoVolumeId.current);

    const cachedLinks = useMemoArrayNoMatterTheOrder(links);

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(loadSharedLinks(ac.signal).catch(sendErrorReport));
        return () => {
            ac.abort();
        };
    }, []);

    return {
        items: cachedLinks,
        isLoading: isLoading || isDecrypting,
    };
}
