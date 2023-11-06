import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';

import { sendErrorReport } from '../../utils/errorHandling';
import { DecryptedLink, useLinksListing } from '../_links';
import useLinksState from '../_links/useLinksState';

/**
 * useLinksDetailsView loads links if not cached yet and provides some
 * aggregated information such as their count or size.
 */
export default function useLinksDetailsView(selectedLinks: DecryptedLink[]) {
    const { loadLinksMeta } = useLinksListing();
    const linksState = useLinksState();

    const [links, setLinks] = useState<DecryptedLink[]>([]);
    const [error, setError] = useState<any>();
    const [isLoading, withLoading] = useLoading();

    useEffect(() => {
        const ac = new AbortController();

        const linksByShareId: Record<string, string[]> = {};

        selectedLinks.forEach(({ rootShareId, linkId }) => {
            if (!linksByShareId[rootShareId]) {
                linksByShareId[rootShareId] = [];
            }

            linksByShareId[rootShareId].push(linkId);
        });

        void withLoading(
            Promise.all(
                Object.keys(linksByShareId).map((shareId) => {
                    const linkIds = linksByShareId[shareId];

                    const cache = true;
                    return loadLinksMeta(ac.signal, 'details', shareId, linkIds, cache).then(async () => {
                        const decrypted = linkIds
                            .map((linkId) => linksState.getLink(shareId, linkId)?.decrypted)
                            .filter((link): link is DecryptedLink => !!link && !link.corruptedLink);

                        if (decrypted.length !== linkIds.length) {
                            // This error is never shown in the UI, so no need to translate it
                            throw new Error('Could not decrypt all links in details modal');
                        }

                        setLinks(decrypted);
                    });
                })
            ).catch((err) => {
                setError(err);
                sendErrorReport(err);
            })
        );

        return () => {
            ac.abort();
        };
    }, []);

    const hasFile = links.some(({ isFile }) => isFile);

    return {
        isLoading,
        error,
        hasFile,
        count: links.length,
        size: links.reduce((sum, current) => sum + current.size, 0),
    };
}
