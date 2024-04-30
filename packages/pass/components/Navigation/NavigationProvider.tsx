import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext, useMemo } from 'react';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';

import type { ItemFilters, Maybe, MaybeNull, SelectedItem } from '@proton/pass/types';
import { objectFilter } from '@proton/pass/utils/object/filter';

import {
    decodeFilters,
    decodeFiltersFromSearch,
    encodeFilters,
    getItemRoute,
    getOnboardingRoute,
    getTrashRoute,
} from './routing';

export type NavigateOptions<LocationState = any> = {
    filters?: Partial<ItemFilters>;
    hash?: string;
    mode?: 'push' | 'replace';
    searchParams?: { [key: string]: any };
    state?: LocationState;
};

export type ItemSelectOptions<LocationState = any> = NavigateOptions<LocationState> & {
    inTrash?: boolean;
    prefix?: string;
    view?: 'edit' | 'view' | 'history';
};

export type NavigationContextValue = {
    /** Parsed search parameter filters. */
    filters: ItemFilters;
    /** Flag indicating whether we are currently on the onboarding route */
    matchOnboarding: boolean;
    /** Flag indicating whether we are currently on a trash route */
    matchTrash: boolean;
    /** Selected item's `itemId` and `shareId` parsed from URL */
    selectedItem: Maybe<SelectedItem>;
    /** Wraps react-router-dom's `useHistory` and provides extra options
     * to chose the navigation mode (push, replace) and wether you want to
     * push new search parameters to the target path. */
    navigate: <S>(pathname: string, options?: NavigateOptions<S>) => void;
    /** Navigates to an item view. By default it will go to the `view` screen,
     * but this can be customized via options. */
    selectItem: <S>(shareId: string, itemId: string, options?: ItemSelectOptions<S>) => void;
    /** Sets the filters and updates the location's search parameters. */
    setFilters: (filters: Partial<ItemFilters>) => void;
    /** Joins the current location search parameters to the provided path */
    preserveSearch: (path: string) => string;
    /** Resolves the current location */
    getCurrentLocation: () => string;
};

const NavigationContext = createContext<MaybeNull<NavigationContextValue>>(null);

export const NavigationProvider: FC<PropsWithChildren> = ({ children }) => {
    const history = useHistory();
    const location = useLocation();

    const filters = decodeFiltersFromSearch(location.search);

    const matchTrash = useRouteMatch(getTrashRoute()) !== null;
    const matchOnboarding = useRouteMatch(getOnboardingRoute()) !== null;

    const itemRoute = getItemRoute(':shareId', ':itemId', { trashed: matchTrash });
    const selectedItem = useRouteMatch<SelectedItem>(itemRoute)?.params;

    const navigate = (pathname: string, options: NavigateOptions = { mode: 'push' }) => {
        const search = new URLSearchParams(history.location.search);

        if (options.searchParams) {
            /* If additional search params were provided */
            Object.entries(options.searchParams).forEach(([key, value]) => search.set(key, value));
        }

        if (options.filters) {
            /* Merge the incoming filters with the current ones */
            const currFilters = decodeFilters(search.get('filters'));
            const newFilters = objectFilter(options.filters, (_, value) => value !== undefined);
            const nextFilters = { ...currFilters, ...newFilters };
            search.set('filters', encodeFilters(nextFilters));
        }

        history[options.mode ?? 'push']({
            pathname,
            search: `?${search.toString()}`,
            hash: options.hash,
            state: options.state,
        });
    };

    const selectItem = (shareId: string, itemId: string, options?: ItemSelectOptions) => {
        const base = getItemRoute(shareId, itemId, { trashed: options?.inTrash, prefix: options?.prefix });
        const view = options?.view && options.view !== 'view' ? `/${options.view}` : '';
        navigate(base + view, options);
    };

    /** Determines whether to replace the history entry only when the search
     * filter have changed. For all other changes, it is preferred to push to
     * the history. This approach prevents creating a new route every time the
     * debounced search value changes, which would pollute the history stack. */
    const setFilters = (update: Partial<ItemFilters>) => {
        const shouldPush =
            (update.selectedShareId && update.selectedShareId !== filters.selectedShareId) ||
            (update.sort && update.sort !== filters.sort) ||
            (update.type && update.type !== filters.type);

        navigate(history.location.pathname, {
            mode: shouldPush ? 'push' : 'replace',
            filters: update,
        });
    };

    const navigation = useMemo<NavigationContextValue>(
        () => ({
            filters,
            matchOnboarding,
            matchTrash,
            selectedItem,
            navigate,
            selectItem,
            setFilters,
            preserveSearch: (path) => path + history.location.search,
            getCurrentLocation: () => history.createHref(history.location),
        }),
        [location.search /* indirectly matches filter changes */, matchOnboarding, matchTrash, selectedItem]
    );

    return <NavigationContext.Provider value={navigation}>{children}</NavigationContext.Provider>;
};

export const useNavigation = (): NavigationContextValue => useContext(NavigationContext)!;
