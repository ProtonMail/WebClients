import type { FC } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { useFilters } from '@proton/pass/hooks/useFilters';
import type { ItemFilters, MaybeNull } from '@proton/pass/types';

import { getItemRoute } from './routing';

type NavigateOptions = { mode?: 'push' | 'replace'; preserveSearch?: boolean };
type ItemSelectOptions = NavigateOptions & { view?: 'edit' | 'view'; inTrash?: boolean };

type NavigationContextValue = {
    /** Parsed search parameter filters. */
    filters: ItemFilters;
    /** Wraps react-router-dom's `useHistory` and provides extra options
     * to chose the navigation mode (push, replace) and wether search parameters
     * should be preserved when navigating */
    navigate: (pathname: string, options?: NavigateOptions) => void;
    /** Navigates to an item view. By default it will go to the `view` screen,
     * but this can be customized via options. */
    selectItem: (shareId: string, itemId: string, options?: ItemSelectOptions) => void;
    /** Sets the filters and updates the location's search parameters */
    setFilters: (filters: Partial<ItemFilters>) => void;
};

const NavigationContext = createContext<MaybeNull<NavigationContextValue>>(null);

export const NavigationProvider: FC = ({ children }) => {
    const history = useHistory();
    const { filters, setFilters } = useFilters();

    const navigate = useCallback(
        (pathname: string, options?: NavigateOptions) =>
            history[options?.mode ?? 'replace']({
                pathname,
                search: options?.preserveSearch ?? true ? location.search : '',
            }),
        []
    );

    const navigation = useMemo<NavigationContextValue>(
        () => ({
            filters,
            navigate,
            selectItem: (shareId: string, itemId: string, options?: ItemSelectOptions) => {
                const base = getItemRoute(shareId, itemId, options?.inTrash);
                const view = options?.view && options.view !== 'view' ? `/${options.view}` : '';
                navigate(base + view, options);
            },
            setFilters,
        }),
        [filters, setFilters]
    );

    return <NavigationContext.Provider value={navigation}>{children}</NavigationContext.Provider>;
};

export const useNavigation = (): NavigationContextValue => useContext(NavigationContext)!;
