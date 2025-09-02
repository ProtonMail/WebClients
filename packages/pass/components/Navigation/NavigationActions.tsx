import type { PropsWithChildren } from 'react';
import { type FC, createContext, useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import type { Location } from 'history';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { ItemFilters, MaybeNull } from '@proton/pass/types';
import { objectFilter } from '@proton/pass/utils/object/filter';

import type { ItemScope } from './routing';
import { decodeFilters, encodeFilters, getItemRoute } from './routing';

export type NavigateOptions<LocationState = any> = {
    filters?: Partial<ItemFilters>;
    hash?: string;
    mode?: 'push' | 'replace';
    searchParams?: { [key: string]: any };
    state?: LocationState;
};

export type ItemSelectOptions<LocationState = any> = NavigateOptions<LocationState> & {
    scope?: ItemScope;
    view?: 'edit' | 'view' | 'history';
};

export type NavigationActionsContextValue = {
    /** Wraps react-router-dom's `useHistory` and provides extra options
     * to chose the navigation mode (push, replace) and wether you want to
     * push new search parameters to the target path. */
    navigate: <S>(pathname: string, options?: NavigateOptions<S>) => void;
    /** Navigates to an item view. By default it will go to the `view` screen,
     * but this can be customized via options. */
    selectItem: <S>(shareId: string, itemId: string, options?: ItemSelectOptions<S>) => void;
    /** Joins the current location search parameters to the provided path */
    preserveSearch: (path: string) => string;
    /** Resolves the current location */
    getCurrentLocation: () => Location;
};

const NavigationActionsContext = createContext<MaybeNull<NavigationActionsContextValue>>(null);

/** Navigation actions are referentially stable to prevent unnecessary re-renders:
 * - Callback functions are memoized
 * - The history object from `useHistory` maintains stable references
 * - No internal state is maintained within the provider */
export const NavigationActionsProvider: FC<PropsWithChildren> = ({ children }) => {
    const history = useHistory();

    const actions = useMemo<NavigationActionsContextValue>(() => {
        const ctx: NavigationActionsContextValue = {
            navigate: (pathname, options = { mode: 'push' }) => {
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

                /** safe-guard against pushing to the same path */
                const method = options.mode ?? (history.location.pathname === pathname ? 'replace' : 'push');

                history[method]({
                    pathname,
                    search: `?${search.toString()}`,
                    hash: options.hash,
                    state: options.state,
                });
            },

            selectItem: (shareId, itemId, options) => {
                const base = getItemRoute(shareId, itemId, { scope: options?.scope });
                const view = options?.view && options.view !== 'view' ? `/${options.view}` : '';
                ctx.navigate(base + view, options);
            },

            preserveSearch: (path) => path + history.location.search,

            getCurrentLocation: () => ({ ...history.location }),
        };

        return ctx;
    }, []);

    return <NavigationActionsContext.Provider value={actions}>{children}</NavigationActionsContext.Provider>;
};

export const useNavigationActions = createUseContext(NavigationActionsContext);
export const useSelectItem = () => useNavigationActions().selectItem;
export const useNavigate = () => useNavigationActions().navigate;
