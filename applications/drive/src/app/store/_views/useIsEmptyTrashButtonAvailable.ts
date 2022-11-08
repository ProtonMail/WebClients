import { useEffect, useState } from 'react';

import { useLinksListing } from '../_links';
import { useDefaultShare } from '../_shares';
import { useAbortSignal } from './utils';

/**
 * useIsEmptyTrashButtonAvailable should not be used.
 * It exists only to provide information for sidebar button in Trash section.
 * The best would be to include it in useTrashView which provides all other
 * data for all other components visible in Trash section. Unfortunately, the
 * sidebar stands next to it and it needs bigger changes of app structure.
 */
export default function useIsEmptyTrashButtonAvailable() {
    const abortSignal = useAbortSignal();
    const { getDefaultShare } = useDefaultShare();
    const [volumeId, setVolumeId] = useState<string>();

    const linksListing = useLinksListing();
    const { links } = linksListing.getCachedTrashed(abortSignal, volumeId);

    useEffect(() => {
        getDefaultShare()
            .then((defaultShare) => {
                setVolumeId(defaultShare.volumeId);
            })
            .catch(console.warn);
    }, []);

    return links.length > 0;
}
