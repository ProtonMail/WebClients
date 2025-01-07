import type { PropsWithChildren } from 'react';
import { type FC, createContext, useMemo } from 'react';
import { matchPath, useLocation, useRouteMatch } from 'react-router-dom';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { Maybe, MaybeNull } from '@proton/pass/types';

import type { ItemScope } from './routing';
import { ItemScopes, getLocalPath } from './routing';

export type NavigationMatchesContextValue = {
    /** Item route scope */
    itemScope: Maybe<ItemScope>;
};

const NavigationMatchesContext = createContext<MaybeNull<NavigationMatchesContextValue>>(null);

export const NavigationMatches: FC<PropsWithChildren> = ({ children }) => {
    const { pathname } = useLocation();

    const matchRootExact = useRouteMatch({ exact: true, path: getLocalPath() }) !== null;
    const itemScope: Maybe<ItemScope> = matchRootExact
        ? 'share' /** root scope is "all vaults" scope */
        : ItemScopes.find((prefix) => matchPath(pathname, getLocalPath(prefix)) !== null);

    return (
        <NavigationMatchesContext.Provider
            value={useMemo<NavigationMatchesContextValue>(() => ({ itemScope }), [itemScope])}
        >
            {children}
        </NavigationMatchesContext.Provider>
    );
};

export const useNavigationMatches = createUseContext(NavigationMatchesContext);
export const useItemScope = () => useNavigationMatches().itemScope;
