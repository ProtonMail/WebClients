import { useCallback, useEffect, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';

import { sendErrorReport } from '../../utils/errorHandling';
import { DecryptedLink, DecryptedLinkWithShareInfo } from '../_links';
import { useAbortSignal } from '../_views/utils';
import { useDirectSharingInfo } from './useDirectSharingInfo';

interface Props {
    shareId: string;
    sharedByMeListing?: boolean;
    links: DecryptedLink[];
    driveSharingFF?: boolean; // TODO: This is used to disable it under FF, remove this props when FF is removed
}

/**
 * useLoadLinksShareInfo allow to enriched standard Decrypted links with sharing info like sharedOn, sharedBy and permissions
 *
 **/
export const useLoadLinksShareInfo = ({ shareId, links, sharedByMeListing = false, driveSharingFF = true }: Props) => {
    // If it's not new direct sharing, we shouldn't load share info, loading should be set to 'false' by default.
    const [isLoading, withLoading] = useLoading(driveSharingFF);
    const abortSignal = useAbortSignal([shareId, withLoading]);
    const [linksWithShareInfo, setLinksWithShareInfo] = useState<Map<string, DecryptedLinkWithShareInfo>>(new Map());
    const { getDirectSharingInfo } = useDirectSharingInfo({ sharedByMeListing });

    const loadLinksShareInfo = useCallback(
        async (signal: AbortSignal) => {
            return Promise.all(
                links.map(async (link) => {
                    const shareId = link.sharingDetails?.shareId;
                    if (!shareId) {
                        return;
                    }
                    const directSharingInfo = await getDirectSharingInfo(signal, shareId);
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
        [links] //TODO: No all deps params as too much work needed in getDirectSharingInfo and all useShare functions
    );

    useEffect(() => {
        if (!driveSharingFF) {
            return;
        }
        void withLoading(loadLinksShareInfo(abortSignal).catch(sendErrorReport));
    }, [abortSignal, withLoading, loadLinksShareInfo, driveSharingFF]);

    return {
        isLoading,
        linksWithShareInfo: [...linksWithShareInfo.values()],
    };
};
