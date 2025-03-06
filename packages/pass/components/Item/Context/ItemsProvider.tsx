import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { secureLinksGet } from '@proton/pass/store/actions';
import {
    createMatchItemsSelector,
    createMatchSecureLinksSelector,
    createMatchSharedByMeSelector,
    createMatchSharedWithMeSelector,
} from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';

type ItemsContextValue = {
    filtered: ItemRevision[];
    searched: ItemRevision[];
    totalCount: number;
};

const ItemsContext = createContext<ItemsContextValue>({ filtered: [], searched: [], totalCount: 0 });

export const ItemsProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();

    const selectedItem = useSelectedItem();
    const shareId = selectedItem?.shareId;
    const itemId = selectedItem?.itemId;

    const scope = useItemScope();
    const trash = scope === 'trash';

    const { filters } = useNavigationFilters();
    const navigate = useNavigate();

    const match = useMemo(() => {
        switch (scope) {
            case 'secure-links':
                return createMatchSecureLinksSelector();
            case 'shared-by-me':
                return createMatchSharedByMeSelector();
            case 'shared-with-me':
                return createMatchSharedWithMeSelector();
            default:
                return createMatchItemsSelector();
        }
    }, [scope]);

    const items = useSelector((state: State) =>
        match(state, {
            type: filters.type === '*' ? null : filters.type,
            search: filters.search,
            shareId: trash ? null : filters.selectedShareId,
            sort: filters.sort,
            trashed: trash,
        })
    );

    useEffect(() => {
        /* Check if the currently selected item is not present in the current
         * filtered item list. In such cases, unselect it and re-trigger the
         * autoselect. This scenario can occur during search operations or when
         * items are moved/restored. */
        const conflict = itemId && shareId && !items.filtered.some(itemEq({ itemId, shareId }));
        if (conflict) navigate(getLocalPath(scope), { mode: 'replace' });
    }, [items, shareId, itemId, scope]);

    useEffect(() => {
        /** Try to revalidate the secure links data every time we navigate
         * to a secure-links route. The underlying effect is throttled to
         * a maximum of once every minute (see `secureLinksGet` maxAge) */
        if (scope === 'secure-links') dispatch(secureLinksGet.intent());
    }, [scope]);

    return <ItemsContext.Provider value={items}>{children}</ItemsContext.Provider>;
};

export const useItems = () => useContext(ItemsContext);
