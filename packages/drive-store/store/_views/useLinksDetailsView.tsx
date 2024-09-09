import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';

import { sendErrorReport } from '../../utils/errorHandling';
import type { DecryptedLink } from '../_links';
import { useLinksListing } from '../_links';

/**
 * useLinksDetailsView loads links if not cached yet and provides some
 * aggregated information such as their count or size.
 */
export default function useLinksDetailsView(selectedLinks: { rootShareId: string; linkId: string }[]) {
    const { loadLinksMeta } = useLinksListing();

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
                    const meta = await loadLinksMeta(ac.signal, 'details', shareId, linkIds);

                    if (meta.errors.length > 0) {
                        setHasError(true);
                        console.error(new Error('Failed to load links meta in details modal'), {
                            shareId,
                            linkIds: linkIds.filter((id) => !meta.links.find((link) => link.linkId === id)),
                            errors: meta.errors,
                        });

                        return;
                    }

                    loadedLinks.push(...meta.links);
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
