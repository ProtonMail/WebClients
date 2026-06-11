import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

export type QueryParamSource = 'search' | 'hash' | 'both';

/**
 * Hook to extract a parameter from the URL and optionally clear it after reading.
 *
 * The parameter can be passed in the query string (`?q=...`) or in the URL hash
 * fragment (`#q=...`). The hash fragment is **never sent to the server** by the
 * browser, so passing sensitive values (e.g. a user's question) via `#` keeps them
 * out of server-side access logs while remaining readable client-side. When a value
 * exists in both places, the hash takes precedence.
 *
 * The value is held in state until the next navigation changes the URL independently,
 * so consumers (e.g. useEditorQuery) can act on it asynchronously.
 *
 * @param paramName - The name of the parameter to extract
 * @param clearAfterRead - Whether to remove the parameter from the URL after reading (default: true)
 * @param source - Where to read the parameter from: query string, hash fragment, or both (default: 'both')
 * @returns The parameter value or null if not present
 */
export const useQueryParam = (
    paramName: string,
    clearAfterRead: boolean = true,
    source: QueryParamSource = 'both'
): string | null => {
    const location = useLocation();
    const history = useHistory();
    const [paramValue, setParamValue] = useState<string | null>(null);
    // Tracks whether we ourselves removed the param via history.replace so we don't
    // immediately wipe the state value when the effect re-fires due to the URL changing.
    const clearedByUs = useRef(false);

    useEffect(() => {
        const readSearch = source !== 'hash';
        const readHash = source !== 'search';

        const searchParams = new URLSearchParams(location.search);
        // location.hash keeps the leading '#'; strip it before parsing as key=value pairs.
        const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));

        // Prefer the hash value: it is the privacy-preserving variant that stays client-side.
        const value =
            (readHash ? hashParams.get(paramName) : null) ?? (readSearch ? searchParams.get(paramName) : null);

        if (value) {
            setParamValue(value);

            if (clearAfterRead) {
                clearedByUs.current = true;

                // Preserve untouched parts of the URL verbatim. Only the segment we strip the
                // param from is re-serialized, so a plain anchor hash (e.g. `#section`) on a
                // search-only read isn't accidentally rewritten.
                let newSearch = location.search;
                let newHash = location.hash;

                if (readSearch && searchParams.has(paramName)) {
                    searchParams.delete(paramName);
                    const next = searchParams.toString();
                    newSearch = next ? `?${next}` : '';
                }
                if (readHash && hashParams.has(paramName)) {
                    hashParams.delete(paramName);
                    const next = hashParams.toString();
                    newHash = next ? `#${next}` : '';
                }

                history.replace(`${location.pathname}${newSearch}${newHash}`);
            }
        } else if (paramValue !== null) {
            if (clearedByUs.current) {
                // We just removed the param ourselves — keep the state value for consumers.
                clearedByUs.current = false;
            } else {
                // The param disappeared due to external navigation — clear the value.
                setParamValue(null);
            }
        }
    }, [paramName, clearAfterRead, source, location.search, location.pathname, location.hash, history, paramValue]);

    return paramValue;
};
