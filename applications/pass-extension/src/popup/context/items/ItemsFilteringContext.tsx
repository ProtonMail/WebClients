import { type FC, createContext, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import usePrevious from '@proton/hooks/usePrevious';
import { popupTabStateSave } from '@proton/pass/store/actions/creators/popup';
import type { ItemSortFilter, ItemTypeFilter, MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { useDebouncedValue } from '../../../shared/hooks';
import { usePopupContext } from '../../hooks/usePopupContext';

export type ItemsFilteringContextType = {
    search: string;
    debouncedSearch: string;
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
    debouncedSearch: '',
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

const SEARCH_DEBOUNCE_TIME = 150;

export const ItemsFilteringContextProvider: FC = ({ children }) => {
    const popup = usePopupContext();
    const dispatch = useDispatch();

    const [search, setSearch] = useState<string>(popup.state.initial.search ?? '');
    const [sort, setSort] = useState<ItemSortFilter>(popup.state.initial.filters?.sort ?? INITIAL_SORT);
    const [type, setType] = useState<ItemTypeFilter>(popup.state.initial.filters?.type ?? '*');
    const [shareId, setShareId] = useState<MaybeNull<string>>(popup.state.initial.filters?.shareId ?? null);
    const [shareBeingDeleted, setShareBeingDeleted] = useState<MaybeNull<string>>(null);
    const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_TIME);

    const filters = useMemo(
        () => ({ filters: { sort, type, shareId }, search: debouncedSearch }),
        [sort, type, debouncedSearch, shareId]
    );

    const prevFilters = usePrevious(filters);

    /* when updating filters : discard any selected item from
     * the current popup tab. Don't dispatch on initial mount
     * (`prevFilters` will be `undefined`) */
    useEffect(() => {
        if (prevFilters) {
            dispatch(
                popupTabStateSave({
                    tabId: popup.context!.tabId,
                    domain: popup.url.subdomain ?? popup.url.domain ?? null,
                    selectedItem: null,
                    ...filters,
                })
            );
        }
    }, [filters]);

    const context: ItemsFilteringContextType = useMemo(
        () => ({
            search,
            debouncedSearch,
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
        [search, debouncedSearch, sort, type, shareId, shareBeingDeleted]
    );

    return <ItemsFilteringContext.Provider value={context}>{children}</ItemsFilteringContext.Provider>;
};
