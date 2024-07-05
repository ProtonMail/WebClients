import { useCallback, useEffect, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { ParsedSearchParams, changeSearchParams, getSearchParams } from '@proton/shared/lib/helpers/url';

type SetSearchParams = (nextInit: ParsedSearchParams | ((prev: ParsedSearchParams) => ParsedSearchParams)) => void;

/**
 * A convenient wrapper for reading and writing search parameters via the
 * URLSearchParams interface.
 */
export default function useSearchParams(init?: ParsedSearchParams): [ParsedSearchParams, SetSearchParams] {
    const location = useLocation();
    const history = useHistory();

    const searchParams = useMemo(() => getSearchParams(location.hash), [location.hash]);

    const setSearchParams = useCallback<SetSearchParams>(
        (update) => {
            const newParams = typeof update === 'function' ? update(searchParams) : update;
            const newRoute = changeSearchParams(location.pathname, location.hash, newParams);
            history.push(newRoute);
        },
        [history, searchParams]
    );

    useEffect(() => {
        if (init) {
            setSearchParams(init);
        }
    }, [init]);

    return [searchParams, setSearchParams];
}
