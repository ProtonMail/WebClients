import { useEffect, useRef, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

/**
 * Hook to extract a query parameter from the URL and optionally clear it after reading.
 * The value is held in state until the next navigation changes the URL independently,
 * so consumers (e.g. useEditorQuery) can act on it asynchronously.
 *
 * @param paramName - The name of the query parameter to extract
 * @param clearAfterRead - Whether to remove the parameter from the URL after reading (default: true)
 * @returns The parameter value or null if not present
 */
export const useQueryParam = (paramName: string, clearAfterRead: boolean = true): string | null => {
    const location = useLocation();
    const history = useHistory();
    const [paramValue, setParamValue] = useState<string | null>(null);
    // Tracks whether we ourselves removed the param via history.replace so we don't
    // immediately wipe the state value when the effect re-fires due to location.search changing.
    const clearedByUs = useRef(false);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const value = searchParams.get(paramName);

        if (value) {
            setParamValue(value);

            if (clearAfterRead) {
                clearedByUs.current = true;
                // Remove the parameter from URL to prevent re-execution on refresh/remount
                searchParams.delete(paramName);
                const newSearch = searchParams.toString();
                const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}${location.hash}`;
                history.replace(newUrl);
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
    }, [paramName, clearAfterRead, location.search, location.pathname, location.hash, history, paramValue]);

    return paramValue;
};

