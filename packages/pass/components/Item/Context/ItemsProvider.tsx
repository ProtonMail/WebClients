import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import { useNavigationMatches } from '@proton/pass/components/Navigation/NavigationMatches';
import { getLocalPath, maybeTrash } from '@proton/pass/components/Navigation/routing';
import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { selectItemsSearchResult } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';

type ItemsContextValue = {
    filtered: ItemRevision[];
    searched: ItemRevision[];
    totalCount: number;
};

const ItemsContext = createContext<ItemsContextValue>({ filtered: [], searched: [], totalCount: 0 });

export const ItemsProvider: FC<PropsWithChildren> = ({ children }) => {
    const selectedItem = useSelectedItem();
    const shareId = selectedItem?.shareId;
    const itemId = selectedItem?.itemId;

    const { matchTrash } = useNavigationMatches();
    const { filters } = useNavigationFilters();
    const navigate = useNavigate();

    const items = useSelector((state: State) =>
        selectItemsSearchResult(state, {
            type: filters.type === '*' ? null : filters.type,
            search: filters.search,
            shareId: matchTrash ? null : filters.selectedShareId,
            sort: filters.sort,
            trashed: matchTrash,
        })
    );
    useEffect(() => {
        /* Check if the currently selected item is not present in the current
         * filtered item list. In such cases, unselect it and re-trigger the
         * autoselect. This scenario can occur during search operations or when
         * items are moved/restored. */
        const conflict = itemId && shareId && !items.filtered.some(itemEq({ itemId, shareId }));
        if (conflict) navigate(getLocalPath(maybeTrash('', matchTrash)), { mode: 'replace' });
    }, [items, shareId, itemId, matchTrash]);

    return <ItemsContext.Provider value={items}>{children}</ItemsContext.Provider>;
};

export const useItems = () => useContext(ItemsContext);
