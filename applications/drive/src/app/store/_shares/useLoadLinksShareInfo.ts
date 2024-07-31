import { useCallback, useEffect, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';

import { sendErrorReport } from '../../utils/errorHandling';
import type { DecryptedLink, DecryptedLinkWithShareInfo } from '../_links';
import { useAbortSignal } from '../_views/utils';
import { useDirectSharingInfo } from './useDirectSharingInfo';

interface Props {
    shareId: string;
    sharedByMeListing?: boolean;
    links: DecryptedLink[];
    driveSharingFF?: boolean; // TODO: This is used to disable it under FF, remove this props when FF is removed
    areLinksLoading: boolean;
}

/**
 * useLoadLinksShareInfo allow to enriched standard Decrypted links with sharing info like sharedOn, sharedBy and permissions
 *
 **/
export const useLoadLinksShareInfo = ({
    shareId,
    links,
    areLinksLoading,
    sharedByMeListing = false,
    driveSharingFF = true,
}: Props) => {
    // If it's not new direct sharing, we shouldn't load share info, loading should be set to 'false' by default.
    const [isLoading, withLoading] = useLoading(driveSharingFF);
    const abortSignal = useAbortSignal([shareId, withLoading]);
    const [linksWithShareInfo, setLinksWithShareInfo] = useState<Map<string, DecryptedLinkWithShareInfo>>(new Map());
    const { getDirectSharingInfo } = useDirectSharingInfo({ sharedByMeListing });

    const loadLinksShareInfo = useCallback(
        async (signal: AbortSignal) => {
            const newState = new Map();
            for (const link of links) {
                const uniqueId = `${link.volumeId}${link.linkId}`;
                if (linksWithShareInfo.has(uniqueId)) {
                    newState.set(uniqueId, linksWithShareInfo.get(uniqueId));
                } else {
                    const linkShareId = link.sharingDetails?.shareId;
                    const directSharingInfo = linkShareId ? await getDirectSharingInfo(signal, linkShareId) : {};
                    newState.set(uniqueId, {
                        ...link,
                        ...directSharingInfo,
                    });
                }
            }
            setLinksWithShareInfo(newState);
        },
        [links] //TODO: No all deps params as too much work needed in getDirectSharingInfo and all useShare functions
    );

    useEffect(() => {
        // Not nice: we block loading extra info until all the basic stuff is loaded first to avoid performance issues.
        // We must redo it a lot, probably with refactor or if users will have too many shared items quickly.
        // The view should show cached items in meantime.
        if (!driveSharingFF || areLinksLoading) {
            return;
        }
        void withLoading(loadLinksShareInfo(abortSignal).catch(sendErrorReport));
    }, [loadLinksShareInfo, areLinksLoading]);

    return {
        isLoading,
        linksWithShareInfo: [...linksWithShareInfo.values()],
    };
};
