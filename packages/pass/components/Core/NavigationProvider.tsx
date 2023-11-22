import type { FC } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { useFilters } from '@proton/pass/hooks/useFilters';
import type { ItemFilters, Maybe, MaybeNull, SelectedItem } from '@proton/pass/types';

import { getItemRoute, getLocalPath, getTrashRoute } from './routing';

type NavigateOptions = { mode?: 'push' | 'replace'; search?: string };
type ItemSelectOptions = NavigateOptions & { view?: 'edit' | 'view'; inTrash?: boolean };

type NavigationContextValue = {
    /** Parsed search parameter filters. */
    filters: ItemFilters;
    /** Flag indicating wether we are currently on an empty route */
    matchEmpty: boolean;
    /** Flag indicating wether we are currently on a trash route */
    matchTrash: boolean;
    /** Selected item's `itemId` and `shareId` parsed from URL */
    selectedItem: Maybe<SelectedItem>;
    /** Wraps react-router-dom's `useHistory` and provides extra options
     * to chose the navigation mode (push, replace) and wether you want to
     * push new search parameters to the target path. */
    navigate: (pathname: string, options?: NavigateOptions) => void;
    /** Navigates to an item view. By default it will go to the `view` screen,
     * but this can be customized via options. */
    selectItem: (shareId: string, itemId: string, options?: ItemSelectOptions) => void;
    /** Sets the filters and updates the location's search parameters. You can pass
     * an optional `pathname` argument if you want to navigate in the same call */
    setFilters: (filters: Partial<ItemFilters>, pathname?: string) => void;
};

const NavigationContext = createContext<MaybeNull<NavigationContextValue>>(null);

export const NavigationProvider: FC = ({ children }) => {
    const history = useHistory();
    const { filters, setFilters } = useFilters();

    const matchTrash = useRouteMatch(getTrashRoute()) !== null;
    const matchEmpty = useRouteMatch(getLocalPath('empty')) !== null;
    const selectedItem = useRouteMatch<SelectedItem>(getItemRoute(':shareId', ':itemId', matchTrash))?.params;

    const navigate = useCallback(
        (pathname: string, options: NavigateOptions = { mode: 'push' }) =>
            history[options.mode ?? 'push']({
                pathname,
                search: options.search ?? history.location.search,
            }),
        []
    );

    const navigation = useMemo<NavigationContextValue>(
        () => ({
            filters,
            matchEmpty,
            matchTrash,
            selectedItem,
            navigate,
            selectItem: (shareId: string, itemId: string, options?: ItemSelectOptions) => {
                const base = getItemRoute(shareId, itemId, options?.inTrash);
                const view = options?.view && options.view !== 'view' ? `/${options.view}` : '';
                navigate(base + view, options);
            },
            setFilters,
        }),
        [filters, matchTrash, matchEmpty, setFilters]
    );

    return <NavigationContext.Provider value={navigation}>{children}</NavigationContext.Provider>;
};

export const useNavigation = (): NavigationContextValue => useContext(NavigationContext)!;
