import { useCallback, useEffect, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { getSearchParamString } from '@proton/utils/searchParams';

type SearchData = string | URLSearchParams | [string, any][] | Record<string, any>;
/**
 * The function returned by `useSearchParams` to update the current query string.
 *
 * @param nextSearch - The new query params. Accepted forms: a `string`, a
 *   `URLSearchParams`, an array of `[key, value]` pairs, a plain object
 *   (serialized via `getSearchParamString`, dropping falsy values except `0`
 *   and expanding arrays into repeated keys), a functional updater
 *   `(current) => SearchData` receiving the current params, or `undefined` to
 *   clear the query.
 * @param options - Optional navigation options.
 * @param options.replace - Replace the current history entry instead of pushing
 *   a new one (default `false`).
 * @param options.state - Arbitrary location state stored on the new entry.
 */
type SetSearchParamFunction = (
    nextSearch: SearchData | ((currentSearch: URLSearchParams) => SearchData) | undefined,
    options?: { replace?: boolean; state?: any }
) => void;

/**
 * Reactive access to the current location's search (query) params, mirroring
 * the `useSearchParams` hook introduced in react-router 6.
 * @see {@link https://reactrouter.com/6.30.4/hooks/use-search-params}
 *
 * Reads from `location.search` (not the hash). Navigation updates preserve the
 * current `pathname` and `hash`.
 *
 * @param initParams - Optional initial query params applied once on mount via
 *   `setSearchParams`. Omitted or `undefined` skips the initial navigation.
 *
 * @returns [searchParams, setSearchParams] -
 * - `searchParams` — `URLSearchParams` built from `location.search`
 * - `setSearchParams` — updates the query string
 *
 * @example
 * const [searchParams, setSearchParams] = useSearchParams();
 *
 * // read
 * searchParams.get('tab'); // => 'settings'
 *
 * // update (keeps pathname + hash)
 * setSearchParams({ tab: 'settings', ids: [1, 2] });
 * // history -> '/current-path?tab=settings&ids=1&ids=2#hash'
 *
 * @example
 * // functional updater
 * setSearchParams((current) => ({ tab: `${current.get('tab')}!` }));
 */
export function useSearchParams(
    initParams?: SearchData
): [search: URLSearchParams, setSearchParams: SetSearchParamFunction] {
    const { search, pathname, hash } = useLocation();
    const history = useHistory();

    const params = useMemo(() => new URLSearchParams(search), [search]);

    const setSearchParams: SetSearchParamFunction = useCallback(
        (nextSearch, { replace, state } = {}) => {
            let newParamString = '';
            const newSearch = typeof nextSearch === 'function' ? nextSearch(new URLSearchParams(search)) : nextSearch;

            if (
                newSearch instanceof URLSearchParams ||
                typeof newSearch === 'string' ||
                Array.isArray(newSearch) ||
                !newSearch
            ) {
                newParamString = new URLSearchParams(newSearch).toString();
            } else {
                //if object we use the utility we have to polish the nullable values
                newParamString = getSearchParamString(newSearch);
            }

            const searchString = newParamString ? `?${newParamString}` : '';
            const newLocation = `${pathname}${searchString}${hash}`;

            if (replace) {
                history.replace(newLocation, state);
            } else {
                history.push(newLocation, state);
            }
        },
        [history, pathname, hash, search]
    );

    useEffect(() => {
        if (initParams) {
            setSearchParams(initParams);
        }
    }, []);

    return [params, setSearchParams];
}
