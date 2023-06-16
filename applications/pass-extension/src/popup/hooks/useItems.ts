import { useContext } from 'react';
import { useSelector } from 'react-redux';

import { selectMatchedAndFilteredItemsWithOptimistic, selectMatchedTrashItemsWithOptimistic } from '@proton/pass/store';

import { ItemsFilteringContext } from '../context/items/ItemsFilteringContext';

export const useItems = () => {
    const filtering = useContext(ItemsFilteringContext);
    const { debouncedSearch, sort, filter, shareId } = filtering;

    const matchedAndFilteredItems = useSelector(
        selectMatchedAndFilteredItemsWithOptimistic({
            itemType: filter === '*' ? null : filter,
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

    const matched = useSelector(selectMatchedTrashItemsWithOptimistic(debouncedSearch));

    return { filtering, ...matched };
};
