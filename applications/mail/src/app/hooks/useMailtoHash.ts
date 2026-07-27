import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import { MAILTO_PROTOCOL_HANDLER_SEARCH_PARAM } from '../constants';
import { useOnMailTo } from '../containers/ComposeProvider';

// e.g. `mailto=mailto:` — the search param followed by the mailto scheme
const MAILTO_PREFIX = `${MAILTO_PROTOCOL_HANDLER_SEARCH_PARAM}=`;
const MAILTO_HANDOFF = `${MAILTO_PREFIX}mailto:`;

/**
 * URLs with a mailto protocol handler can be used to prefill the composer.
 * The mailto link is in the format `#mailto=mailto:...&subject=...&body=...`
 *
 * The hash is read from react-router's location at render time, so the value is captured before any
 * category redirect effect (which runs first, being deeper in the tree) can rewrite the hash. This
 * hook is mounted at the mailbox-container level so it also covers redirect-only entry points such
 * as the account root (`/u/:id#mailto=...`).
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
            const mailtoIndex = decodedHash.indexOf(MAILTO_HANDOFF);
            if (mailtoIndex >= 0) {
                // We don't want to select the #mailto= but just the mailto: part
                const mailto = hash.substring(mailtoIndex + MAILTO_PREFIX.length, hash.length);

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
