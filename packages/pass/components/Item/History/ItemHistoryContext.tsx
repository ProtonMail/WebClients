import { createContext, useContext } from 'react';

import type { ItemRevision, MaybeNull } from '@proton/pass/types';

export type ItemHistoryContextValue = {
    item: ItemRevision;
    loading: boolean;
    more: boolean;
    revisions: ItemRevision[];
    loadMore: () => void;
};

export const ItemHistoryContext = createContext<MaybeNull<ItemHistoryContextValue>>(null);

export const useItemHistory = () => {
    const itemHistory = useContext(ItemHistoryContext);
    if (!itemHistory) throw new Error('Item history context not initialized');
    return itemHistory;
};
