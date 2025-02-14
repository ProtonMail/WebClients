import type { PropsWithChildren } from 'react';
import { type FC, createContext, useCallback, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import type { ItemFilters, MaybeNull } from '@proton/pass/types';

import { useNavigate } from './NavigationActions';
import { decodeFiltersFromSearch } from './routing';

export type NavigationFiltersContextValue = {
    /** Parsed search parameter filters. */
    filters: ItemFilters;
    /** Flag indicating whether we are currently on an item list page  */
    setFilters: (filters: Partial<ItemFilters>) => void;
};

const NavigationFiltersContext = createContext<MaybeNull<NavigationFiltersContextValue>>(null);

export const NavigationFilters: FC<PropsWithChildren> = ({ children }) => {
    const history = useHistory();
    const location = useLocation();
    const navigate = useNavigate();

    const filters = useMemo(() => decodeFiltersFromSearch(location.search), [location.search]);
    const filtersRef = useStatefulRef(filters);

    /** Determines whether to replace the history entry only when the search
     * filter have changed. For all other changes, it is preferred to push to
     * the history. This approach prevents creating a new route every time the
     * debounced search value changes, which would pollute the history stack. */
    const setFilters = useCallback((update: Partial<ItemFilters>) => {
        const shouldPush =
            (update.selectedShareId && update.selectedShareId !== filtersRef.current.selectedShareId) ||
            (update.sort && update.sort !== filtersRef.current.sort) ||
            (update.type && update.type !== filtersRef.current.type);

        navigate(history.location.pathname, {
            mode: shouldPush ? 'push' : 'replace',
            filters: update,
        });
    }, []);

    return (
        <NavigationFiltersContext.Provider
            value={useMemo<NavigationFiltersContextValue>(
                () => ({
                    filters,
                    setFilters,
                }),
                [filters]
            )}
        >
            {children}
        </NavigationFiltersContext.Provider>
    );
};

export const useNavigationFilters = createUseContext(NavigationFiltersContext);
