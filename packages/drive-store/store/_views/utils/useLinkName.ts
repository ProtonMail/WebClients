import { useEffect, useState } from 'react';

import { isIgnoredError, logError } from '../../../utils/errorHandling';
import { useLink } from '../../_links';

/**
 * useLinkName returns link name when its loaded.
 */
export default function useLinkName(shareId: string, linkId: string, errorCallback?: (error: any) => void): string {
    const [name, setName] = useState('');

    const { getLink } = useLink();

    useEffect(() => {
        const abortController = new AbortController();
        getLink(abortController.signal, shareId, linkId)
            .then((link) => setName(link.name))
            .catch((err) => {
                logError(err);
                if (!isIgnoredError(err)) {
                    errorCallback?.(err);
                }
            });
        return () => {
            abortController.abort();
        };
    }, [shareId, linkId]);

    return name;
}
