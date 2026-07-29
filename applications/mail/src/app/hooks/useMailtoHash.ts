import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import { MAILTO_PROTOCOL_HANDLER_SEARCH_PARAM } from '../constants';
import { useOnMailTo } from '../containers/ComposeProvider';
import { parseMailtoParams } from '../helpers/url';

// e.g. `mailto=mailto:` — the search param followed by the mailto scheme
const MAILTO_PREFIX = `${MAILTO_PROTOCOL_HANDLER_SEARCH_PARAM}=`;
const MAILTO_HANDOFF = `${MAILTO_PREFIX}mailto:`;
const ENCODED_MAILTO_HANDOFF = `${MAILTO_PREFIX}mailto%3A`;

/**
 * Takes a URL hash and return the mailto component.
 *
 * Handles:
 * - raw (`#mailto=mailto:a@b.com?subject=Hi`)
 * - encoded (`#mailto=mailto%3Aa%40b.com%3Fsubject%3DHi`) mailto links.
 */
const getMailToString = (hash: string): string | undefined => {
    const rawIndex = hash.indexOf(MAILTO_HANDOFF);
    if (rawIndex !== -1) {
        return hash.substring(rawIndex + MAILTO_PREFIX.length);
    }

    const encodedIndex = hash.indexOf(ENCODED_MAILTO_HANDOFF);
    if (encodedIndex !== -1) {
        const encoded = hash.substring(encodedIndex + MAILTO_PREFIX.length);
        return decodeURIComponent(encoded);
    }

    return undefined;
};

const buildSafeMailto = (mailtoString: string): string => {
    const separatorIndex = mailtoString.search(/[?&]/);
    const to = separatorIndex === -1 ? mailtoString : mailtoString.slice(0, separatorIndex);
    const rest = separatorIndex === -1 ? '' : mailtoString.slice(separatorIndex + 1);

    const query = Object.entries(parseMailtoParams(rest))
        .flatMap(([key, value]) => (value === null ? [] : [`${key}=${encodeURIComponent(value)}`]))
        .join('&');

    return query ? `${to}?${query}` : to;
};

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
            const mailtoString = getMailToString(hash);
            if (!mailtoString) {
                return;
            }

            const mailtoQuery = buildSafeMailto(mailtoString);
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
