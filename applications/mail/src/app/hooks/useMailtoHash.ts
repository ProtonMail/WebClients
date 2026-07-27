import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import { useOnMailTo } from '../containers/ComposeProvider';

/**
 * URLs with a mailto protocol handler can be used to prefill the composer.
 * The mailto link is in the format `#mailto=mailto:...&subject=...&body=...`
 *
 */
const useMailtoHash = ({ isSearch }: { isSearch: boolean }) => {
    const onMailTo = useOnMailTo();
    const { hash } = useLocation();
    const lastMailtoRef = useRef<string>();

    useEffect(() => {
        if (isSearch || !hash) {
            return;
        }

        try {
            const decodedHash = decodeURIComponent(hash);
            const mailtoIndex = decodedHash.indexOf('mailto=mailto:');
            if (mailtoIndex >= 0) {
                // We don't want to select the #mailto= but just the mailto: part
                const mailto = hash.substring(mailtoIndex + 'mailto='.length, hash.length);

                // A category redirect can rewrite the hash while keeping the same mailto handoff.
                // Guard against reopening the composer for a mailto we have already processed.
                if (lastMailtoRef.current === mailto) {
                    return;
                }
                lastMailtoRef.current = mailto;

                onMailTo(decodeURIComponent(mailto));
            }
        } catch (e: any) {
            console.error(e);
        }
    }, [onMailTo, hash, isSearch]);
};

export default useMailtoHash;
