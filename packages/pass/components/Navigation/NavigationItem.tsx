import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext, useMemo } from 'react';
import { useRouteMatch } from 'react-router-dom';

import type { Maybe, SelectedItem } from '@proton/pass/types';

import { getItemRoutes } from './routing';

const NavigationItemContext = createContext<Maybe<SelectedItem>>(undefined);

export const NavigationItem: FC<PropsWithChildren> = ({ children }) => {
    /** Memoize the selected item parameters to maintain referential stability.
     * This prevents re-renders when the URL changes but the actual shareId/itemId
     * remain the same, since `useRouteMatch` always returns a new object */
    const selectedItemMatch = useRouteMatch<SelectedItem>(getItemRoutes())?.params;
    const selectedItem = useMemo(() => selectedItemMatch, [selectedItemMatch?.shareId, selectedItemMatch?.itemId]);

    return <NavigationItemContext.Provider value={selectedItem}>{children}</NavigationItemContext.Provider>;
};

export const useSelectedItem = () => useContext(NavigationItemContext);
