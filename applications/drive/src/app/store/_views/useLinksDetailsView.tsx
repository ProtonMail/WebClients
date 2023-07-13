import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';

import { sendErrorReport } from '../../utils/errorHandling';
import { DecryptedLink, useLinks } from '../_links';

/**
 * useLinksDetailsView loads links if not cached yet and provides some
 * aggregated information such as their count or size.
 */
export default function useLinksDetailsView(selectedLinks: DecryptedLink[]) {
    const { getLinks } = useLinks();

    const [links, setLinks] = useState<DecryptedLink[]>([]);
    const [error, setError] = useState<any>();
    const [isLoading, withLoading] = useLoading();

    useEffect(() => {
        const abortController = new AbortController();
        void withLoading(
            getLinks(
                abortController.signal,
                selectedLinks.map(({ linkId, rootShareId }) => ({ linkId, shareId: rootShareId }))
            )
                .then((links) => {
                    setLinks(links);
                })
                .catch((err) => {
                    setError(err);
                    sendErrorReport(err);
                })
        );
        return () => {
            abortController.abort();
        };
    }, [selectedLinks]);

    const hasFile = links.some(({ isFile }) => isFile);
    const hasFolder = links.some(({ isFile }) => !isFile);

    return {
        isLoading,
        error,
        hasFile,
        hasFolder,
        count: links.length,
        size: links.reduce((sum, current) => sum + current.size, 0),
    };
}
