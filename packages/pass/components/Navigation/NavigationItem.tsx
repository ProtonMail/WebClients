import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext, useMemo } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { useNavigationMatches } from '@proton/pass/components/Navigation/NavigationMatches';
import type { Maybe, SelectedItem } from '@proton/pass/types';

import { getItemRoute } from './routing';

const NavigationItemContext = createContext<Maybe<SelectedItem>>(undefined);

export const NavigationItem: FC<PropsWithChildren> = ({ children }) => {
    const { matchTrash } = useNavigationMatches();

    /** Memoize the selected item parameters to maintain referential stability.
     * This prevents re-renders when the URL changes but the actual shareId/itemId
     * remain the same, since `useRouteMatch` always returns a new object */
    const itemRoute = getItemRoute(':shareId', ':itemId', { trashed: matchTrash });
    const selectedItemMatch = useRouteMatch<SelectedItem>(itemRoute)?.params;
    const selectedItem = useMemo(() => selectedItemMatch, [selectedItemMatch?.shareId, selectedItemMatch?.itemId]);

    return <NavigationItemContext.Provider value={selectedItem}>{children}</NavigationItemContext.Provider>;
};

export const useSelectedItem = () => useContext(NavigationItemContext);
