import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { saveFilters } from '@proton/pass/store/actions/creators/filters';

export const useSaveFilterPreferences = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const { filters } = useNavigationFilters();
    const mounted = useRef(false);

    /** Redirects dropping the search string decode to the default
     * filters: these are not a user choice and must not be saved */
    const hasURLFilters = new URLSearchParams(location.search).has('filters');

    useEffect(() => {
        /** Skip the initial value: it was either restored from
         * the cache or set by a deep link, neither is a user choice */
        if (!mounted.current) mounted.current = true;
        else if (hasURLFilters) dispatch(saveFilters(filters));
    }, [filters.sort, filters.type, hasURLFilters]);
};
