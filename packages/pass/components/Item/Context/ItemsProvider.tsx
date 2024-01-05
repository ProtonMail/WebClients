import { type FC, createContext, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath, maybeTrash } from '@proton/pass/components/Navigation/routing';
import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { selectItemsSearchResult } from '@proton/pass/store/selectors';
import type { ItemRevisionWithOptimistic } from '@proton/pass/types';

type ItemsContextValue = {
    filtered: ItemRevisionWithOptimistic[];
    searched: ItemRevisionWithOptimistic[];
    totalCount: number;
};

const ItemsContext = createContext<ItemsContextValue>({ filtered: [], searched: [], totalCount: 0 });

export const ItemsProvider: FC = ({ children }) => {
    const { filters, matchTrash, selectedItem, navigate } = useNavigation();
    const shareId = selectedItem?.shareId;
    const itemId = selectedItem?.itemId;

    const items = useSelector(
        selectItemsSearchResult(
            matchTrash
                ? {
                      search: filters.search,
                      trashed: true,
                  }
                : {
                      type: filters.type === '*' ? null : filters.type,
                      search: filters.search,
                      shareId: filters.selectedShareId,
                      sort: filters.sort,
                  }
        )
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
