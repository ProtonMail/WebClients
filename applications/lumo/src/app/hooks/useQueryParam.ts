import { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

/**
 * Hook to extract a query parameter from the URL and optionally clear it after reading
 * @param paramName - The name of the query parameter to extract
 * @param clearAfterRead - Whether to remove the parameter from the URL after reading (default: true)
 * @returns The parameter value or null if not present
 */
export const useQueryParam = (paramName: string, clearAfterRead: boolean = true): string | null => {
    const location = useLocation();
    const history = useHistory();
    const [paramValue, setParamValue] = useState<string | null>(null);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const value = searchParams.get(paramName);

        if (value) {
            setParamValue(value);

            if (clearAfterRead) {
                // Remove the parameter from URL to prevent re-execution on refresh/remount
                searchParams.delete(paramName);
                const newSearch = searchParams.toString();
                const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}${location.hash}`;
                
                // Replace the current URL without adding to history
                history.replace(newUrl);
            }
        } else if (paramValue !== null) {
            // Clear the param value if it's no longer in the URL
            setParamValue(null);
        }
    }, [paramName, clearAfterRead, location.search, location.pathname, location.hash, history, paramValue]);

    return paramValue;
};

