import { type FC, createContext, useMemo, useState } from 'react';

import type { ItemType, ItemsSortOption, MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { useDebouncedValue } from '../../../shared/hooks';
import { usePopupContext } from '../../hooks/usePopupContext';

export type ItemsFilterOption = '*' | ItemType;

export type ItemsFilteringContextType = {
    search: string;
    debouncedSearch: string;
    sort: ItemsSortOption;
    filter: ItemsFilterOption;
    shareId: MaybeNull<string>;
    shareBeingDeleted: MaybeNull<string>;
    setSearch: (value: string) => void;
    setSort: (value: ItemsSortOption) => void;
    setFilter: (value: ItemsFilterOption) => void;
    setShareId: (shareId: MaybeNull<string>) => void;
    setShareBeingDeleted: (shareId: MaybeNull<string>) => void;
};

export const INITIAL_SORT: ItemsSortOption = 'recent';

export const ItemsFilteringContext = createContext<ItemsFilteringContextType>({
    search: '',
    debouncedSearch: '',
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

const SEARCH_DEBOUNCE_TIME = 150;

export const ItemsFilteringContextProvider: FC = ({ children }) => {
    const popup = usePopupContext();
    const [search, setSearch] = useState<string>(popup.state.initialSearch);
    const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_TIME);

    const [sort, setSort] = useState<ItemsSortOption>(INITIAL_SORT);
    const [filter, setFilter] = useState<ItemsFilterOption>('*');
    const [shareId, setShareId] = useState<MaybeNull<string>>(null);
    const [shareBeingDeleted, setShareBeingDeleted] = useState<MaybeNull<string>>(null);

    const context: ItemsFilteringContextType = useMemo(
        () => ({
            search,
            debouncedSearch,
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
        [search, debouncedSearch, sort, filter, shareId, shareBeingDeleted]
    );

    return <ItemsFilteringContext.Provider value={context}>{children}</ItemsFilteringContext.Provider>;
};
