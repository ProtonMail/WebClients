import { useEffect, useState } from 'react';

import { useLoading } from '@proton/components';

import { DecryptedLink, useLinks } from '../_links';
import { reportError } from '../_utils';

/**
 * useLinksDetailsView loads links if not cached yet and provides some
 * aggregated information such as their count or size.
 */
export default function useLinksDetailsView(shareId: string, linkIds: string[]) {
    const { getLinks } = useLinks();

    const [links, setLinks] = useState<DecryptedLink[]>([]);
    const [error, setError] = useState<any>();
    const [isLoading, withLoading] = useLoading();

    useEffect(() => {
        const abortController = new AbortController();
        void withLoading(
            getLinks(abortController.signal, shareId, linkIds)
                .then((links) => {
                    setLinks(links);
                })
                .catch((err) => {
                    setError(err);
                    reportError(err);
                })
        );
        return () => {
            abortController.abort();
        };
    }, [shareId, linkIds]);

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
