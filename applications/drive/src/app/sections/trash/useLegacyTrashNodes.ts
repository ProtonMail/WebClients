import { useEffect, useRef } from 'react';

import { useLoading } from '@proton/hooks';

import { useDefaultShare } from '../../store';
import { useLinksListing } from '../../store/_links';
import { useAbortSignal, useMemoArrayNoMatterTheOrder } from '../../store/_views/utils';
import { sendErrorReport } from '../../utils/errorHandling';

export function useLegacyTrashNodes() {
    const { getDefaultPhotosShare } = useDefaultShare();
    const [isLoading, withLoading] = useLoading(true);
    const volumeIds = useRef<string[]>();
    const linksListing = useLinksListing();

    const loadTrashListing = async (signal: AbortSignal) => {
        const photosShare = await getDefaultPhotosShare(signal);
        if (photosShare) {
            volumeIds.current = [photosShare.volumeId];
            await Promise.all([linksListing.loadTrashedLinks(signal, photosShare.volumeId)]);
        }
    };

    const abortSignal = useAbortSignal();
    const { links, isDecrypting } = linksListing.getCachedTrashed(abortSignal, volumeIds.current);
    const cachedTrashedLinks = useMemoArrayNoMatterTheOrder(links);

    useEffect(() => {
        const ac = new AbortController();
        void withLoading(loadTrashListing(ac.signal)).catch(sendErrorReport);
        return () => {
            ac.abort();
        };
    }, []);

    return {
        items: cachedTrashedLinks,
        isLoading: isLoading || isDecrypting,
    };
}
