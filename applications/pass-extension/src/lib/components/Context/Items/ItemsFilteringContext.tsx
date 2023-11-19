import { type FC, createContext, useMemo, useState } from 'react';

import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';

import type { ItemSortFilter, ItemTypeFilter, MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export type ItemsFilteringContextType = {
    search: string;
    sort: ItemSortFilter;
    type: ItemTypeFilter;
    shareId: MaybeNull<string>;
    shareBeingDeleted: MaybeNull<string>;
    setSearch: (value: string) => void;
    setSort: (value: ItemSortFilter) => void;
    setType: (value: ItemTypeFilter) => void;
    setShareId: (shareId: MaybeNull<string>) => void;
    setShareBeingDeleted: (shareId: MaybeNull<string>) => void;
};

export const INITIAL_SORT: ItemSortFilter = 'recent';

export const ItemsFilteringContext = createContext<ItemsFilteringContextType>({
    search: '',
    sort: INITIAL_SORT,
    type: '*',
    shareId: null,
    shareBeingDeleted: null,
    setSearch: noop,
    setSort: noop,
    setType: noop,
    setShareId: noop,
    setShareBeingDeleted: noop,
});

export const ItemsFilteringContextProvider: FC = ({ children }) => {
    const popup = usePopupContext();

    const [search, setSearch] = useState<string>(popup.state.initial?.search ?? '');
    const [sort, setSort] = useState<ItemSortFilter>(popup.state.initial.filters?.sort ?? INITIAL_SORT);
    const [type, setType] = useState<ItemTypeFilter>(popup.state.initial.filters?.type ?? '*');
    const [shareId, setShareId] = useState<MaybeNull<string>>(popup.state.initial.filters?.selectedShareId ?? null);
    const [shareBeingDeleted, setShareBeingDeleted] = useState<MaybeNull<string>>(null);

    const context: ItemsFilteringContextType = useMemo(
        () => ({
            search,
            sort,
            type,
            shareId,
            shareBeingDeleted,
            setSearch,
            setSort,
            setType,
            setShareId,
            setShareBeingDeleted,
        }),
        [search, sort, type, shareId, shareBeingDeleted]
    );

    return <ItemsFilteringContext.Provider value={context}>{children}</ItemsFilteringContext.Provider>;
};
