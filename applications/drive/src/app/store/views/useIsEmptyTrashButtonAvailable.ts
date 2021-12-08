import { useLinksListing } from '../links';
import { useAbortSignal } from './utils';

/**
 * useIsEmptyTrashButtonAvailable should not be used.
 * It exists only to provide information for sidebar button in Trash section.
 * The best would be to include it in useTrashView which provides all other
 * data for all other components visible in Trash section. Unfortunately, the
 * sidebar stands next to it and it needs bigger changes of app structure.
 */
export default function useIsEmptyTrashButtonAvailable(shareId: string) {
    const abortSignal = useAbortSignal([shareId]);

    const linksListing = useLinksListing();
    const [children] = linksListing.getCachedTrashed(abortSignal, shareId);

    return children.length > 0;
}
