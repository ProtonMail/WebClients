import { useEffect, useState } from 'react';

import { useLoading } from '@proton/components';

import { DecryptedLink, useLink } from '../_links';
import { reportError } from '../_utils';

/**
 * useLinkView loads link if not cached yet.
 */
export default function useLinkView(shareId: string, linkId: string) {
    const { getLink } = useLink();

    const [link, setLink] = useState<DecryptedLink>();
    const [error, setError] = useState<any>();
    const [isLoading, withLoading] = useLoading();

    useEffect(() => {
        const abortController = new AbortController();
        void withLoading(
            getLink(abortController.signal, shareId, linkId)
                .then((link) => {
                    setLink(link);
                })
                .catch((err) => {
                    setError(err);
                    reportError(err);
                })
        );
        return () => {
            abortController.abort();
        };
    }, [shareId, linkId]);

    return {
        isLoading,
        error,
        link,
    };
}
