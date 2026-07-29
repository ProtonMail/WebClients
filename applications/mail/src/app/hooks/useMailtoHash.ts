import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import { MAILTO_PROTOCOL_HANDLER_SEARCH_PARAM } from '../constants';
import { useOnMailTo } from '../containers/ComposeProvider';
import { parseMailtoParams } from '../helpers/url';

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
            if (mailtoIndex === -1) {
                return;
            }
            const decodedMailTo = decodedHash.substring(mailtoIndex + MAILTO_PREFIX.length, decodedHash.length);
            const separatorIndex = decodedMailTo.search(/[?&]/);
            const to = separatorIndex === -1 ? decodedMailTo : decodedMailTo.slice(0, separatorIndex);
            const rest = separatorIndex === -1 ? '' : decodedMailTo.slice(separatorIndex + 1);

            // We run the `rest` through the `parseMailtoParams` to remove unwanted query params (for example: category)
            const query = Object.entries(parseMailtoParams(rest))
                .filter(([, value]) => value !== null)
                .map(([key, value]) => `${key}=${encodeURIComponent(value ?? '')}`)
                .join('&');

            // We reconstruct the `mailto:` URL from the safe params to ensure it is valid
            const mailtoQuery = query ? `${to}?${query}` : to;

            // A category redirect can rewrite the hash while keeping the same mailto handoff.
            // Guard against reopening the composer for a mailto we have already processed.
            if (lastMailtoRef.current === mailtoQuery) {
                return;
            }
            lastMailtoRef.current = mailtoQuery;
            onMailTo(mailtoQuery);
        } catch (e: any) {
            console.error(e);
        }
    }, [onMailTo, hash, isSearch]);
};

export default useMailtoHash;
