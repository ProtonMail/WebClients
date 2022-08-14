import { useEffect, useState } from 'react';

import { useLink } from '../../_links';
import { logError } from '../../_utils';

/**
 * useLinkName returns link name when its loaded.
 */
export default function useLinkName(shareId: string, linkId: string): string {
    const [name, setName] = useState('');

    const { getLink } = useLink();

    useEffect(() => {
        const abortController = new AbortController();
        getLink(abortController.signal, shareId, linkId)
            .then((link) => setName(link.name))
            .catch(logError);
        return () => {
            abortController.abort();
        };
    }, [shareId, linkId]);

    return name;
}
