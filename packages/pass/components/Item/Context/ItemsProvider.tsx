import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { itemAny } from '@proton/pass/lib/items/item.predicates';
import { secureLinksGet } from '@proton/pass/store/actions';
import {
    createMatchItemsSelector,
    createMatchSecureLinksSelector,
    createMatchSharedByMeSelector,
    createMatchSharedWithMeSelector,
    selectOptimisticIds,
} from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ItemRevision, UniqueItem } from '@proton/pass/types';

type ItemsContextValue = {
    filtered: ItemRevision[];
    searched: ItemRevision[];
    totalCount: number;
};

const ItemsContext = createContext<ItemsContextValue>({ filtered: [], searched: [], totalCount: 0 });

export const ItemsProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();
    const store = useStore<State>();

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
        /** Check if selected item exists in filtered list - if not, unselect and re-trigger
         * autoselect. Occurs during search/move/restore operations. Debounced to avoid race
         * conditions where `selectedItem` references `optimisticId` while filtered items have
         * real item, causing false conflict detection. */
        const timeoutId = setTimeout(() => {
            if (!(itemId && shareId)) return;

            const state = store.getState();
            const optimisticIds = selectOptimisticIds(state);
            const match: UniqueItem[] = [{ itemId, shareId }];
            if (itemId in optimisticIds) match.push(optimisticIds[itemId]);

            /** Check against both real and optimistic IDs since selectedItem might reference
             * `optimisticId` while filtered items contain real item (or vice versa) */
            const conflict = itemId && shareId && !items.filtered.some(itemAny(match));
            if (conflict) navigate(getLocalPath(scope), { mode: 'replace' });
        }, 50);

        return () => clearTimeout(timeoutId);
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
