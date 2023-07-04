import { useContext } from 'react';
import { useSelector } from 'react-redux';

import { selectItemsSearchResult, selectTrashedItemsSearchResults } from '@proton/pass/store';

import { ItemsFilteringContext } from '../context/items/ItemsFilteringContext';

export const useItems = () => {
    const filtering = useContext(ItemsFilteringContext);
    const { debouncedSearch, sort, type, shareId } = filtering;

    const matchedAndFilteredItems = useSelector(
        selectItemsSearchResult({
            itemType: type === '*' ? null : type,
            search: debouncedSearch,
            shareId,
            sort,
        })
    );

    return { filtering, ...matchedAndFilteredItems };
};

export const useTrashItems = () => {
    const filtering = useContext(ItemsFilteringContext);
    const { debouncedSearch } = filtering;

    const matched = useSelector(selectTrashedItemsSearchResults(debouncedSearch));

    return { filtering, ...matched };
};
