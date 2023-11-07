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
    const [hasError, setHasError] = useState<any>();
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

        void withLoading(async () => {
            try {
                const loadedLinks: DecryptedLink[] = [];

                for (const shareId of Object.keys(linksByShareId)) {
                    const linkIds = linksByShareId[shareId];

                    await loadLinksMeta(ac.signal, 'details', shareId, linkIds, { cache: true }).then(() => {
                        for (const linkId of linkIds) {
                            const link = linksState.getLink(shareId, linkId)?.decrypted;

                            if (!link || link.corruptedLink) {
                                throw new Error('Could not decrypt link in details modal', {
                                    cause: { shareId, linkId },
                                });
                            }

                            loadedLinks.push(link);
                        }
                    });
                }

                setLinks(loadedLinks);
            } catch (e) {
                setHasError(true);
                sendErrorReport(e);
            }
        });

        return () => {
            ac.abort();
        };
    }, []);

    return {
        isLoading,
        hasError,
        count: links.length,
        size: links.reduce((sum, current) => sum + current.size, 0),
    };
}
