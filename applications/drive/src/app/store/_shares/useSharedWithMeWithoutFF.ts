import { useCallback, useEffect } from 'react';

import { sendErrorReport } from '../../utils/errorHandling';
import { useLinksListing } from '../_links';
import { useAbortSignal } from '../_views/utils';

//TODO: This should be removed after full sharing rollout
/**
 * useSharedWithMeWithoutFF provides info if an user have shared with me items even with drive sharing FF disabled.
 * @params {boolean} isSharingInviteAvailable, This is used to prevent loading if the FF is enabled.
 */
export function useSharedWithMeWithoutFF(isSharingInviteAvailable: boolean) {
    const linksListing = useLinksListing();

    const loadSharedWithMeLinks = useCallback(async (signal: AbortSignal) => {
        await linksListing.loadLinksSharedWithMeLink(signal);
    }, []); //TODO: No deps params as too much work needed in linksListing

    const abortSignal = useAbortSignal([loadSharedWithMeLinks]);
    const { links: sharedLinks } = linksListing.getCachedSharedWithMeLink(abortSignal);

    useEffect(() => {
        // We do not want to load if sharing is available as we have the FF
        // Also if there is sharedLinks we already know that we have items
        if (isSharingInviteAvailable || !!sharedLinks.length) {
            return;
        }
        loadSharedWithMeLinks(abortSignal).catch(sendErrorReport);
    }, [isSharingInviteAvailable, loadSharedWithMeLinks, abortSignal]);

    return {
        haveSharedWithMeItems: !!sharedLinks.length,
    };
}
