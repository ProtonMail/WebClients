import { type FC, createContext, useMemo, useState } from 'react';

import type { ItemType, ItemsSortOption, MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { usePopupContext } from '../../hooks/usePopupContext';

export type ItemsFilterOption = '*' | ItemType;

export type ItemsFilteringContextType = {
    search: string;
    sort: ItemsSortOption;
    filter: ItemsFilterOption;
    shareId: MaybeNull<string>;
    shareBeingDeleted: MaybeNull<string>;
    setSearch: (query: string) => void;
    setSort: (value: ItemsSortOption) => void;
    setFilter: (value: ItemsFilterOption) => void;
    setShareId: (shareId: MaybeNull<string>) => void;
    setShareBeingDeleted: (shareId: MaybeNull<string>) => void;
};

export const INITIAL_SORT: ItemsSortOption = 'recent';

export const ItemsFilteringContext = createContext<ItemsFilteringContextType>({
    search: '',
    sort: INITIAL_SORT,
    filter: '*',
    shareId: null,
    shareBeingDeleted: null,
    setSearch: noop,
    setSort: noop,
    setFilter: noop,
    setShareId: noop,
    setShareBeingDeleted: noop,
});

/**
 * Store all state related to filtering / sorting items in the UI.
 * To be used directly or in conjunction with high-level react hooks or low-level redux selectors.
 * This could be in a redux state slice instead, but for now using the redux store mainly for vault contents is preferred.
 */
export const ItemsFilteringContextProvider: FC = ({ children }) => {
    const { state } = usePopupContext();

    const [search, setSearch] = useState<string>(state.popup?.initialSearch ?? '');
    const [sort, setSort] = useState<ItemsSortOption>(INITIAL_SORT);
    const [filter, setFilter] = useState<ItemsFilterOption>('*');
    const [shareId, setShareId] = useState<MaybeNull<string>>(null);
    const [shareBeingDeleted, setShareBeingDeleted] = useState<MaybeNull<string>>(null);

    const context: ItemsFilteringContextType = useMemo(
        () => ({
            search,
            sort,
            filter,
            shareId,
            shareBeingDeleted,
            setSearch,
            setSort,
            setFilter,
            setShareId,
            setShareBeingDeleted,
        }),
        [search, sort, filter, shareId, shareBeingDeleted]
    );

    return <ItemsFilteringContext.Provider value={context}>{children}</ItemsFilteringContext.Provider>;
};
