import { useContext } from 'react';
import { useSelector } from 'react-redux';

import { selectMatchedAndFilteredItemsWithOptimistic, selectMatchedTrashItemsWithOptimistic } from '@proton/pass/store';

import { useDebouncedValue } from '../../shared/hooks';
import { ItemsFilteringContext } from '../context/items/ItemsFilteringContext';

const DEBOUNCE_TIME = 150;

export const useItems = () => {
    const filtering = useContext(ItemsFilteringContext);
    const { search, sort, filter, shareId } = filtering;
    const debouncedSearch = useDebouncedValue(search, DEBOUNCE_TIME);

    const matchedAndFilteredItems = useSelector(
        selectMatchedAndFilteredItemsWithOptimistic({
            itemType: filter === '*' ? null : filter,
            search: debouncedSearch,
            shareId,
            sort,
        })
    );

    return {
        filtering,
        ...matchedAndFilteredItems,
    };
};

export const useTrashItems = () => {
    const filtering = useContext(ItemsFilteringContext);
    const { search } = filtering;
    const debouncedSearch = useDebouncedValue(search, DEBOUNCE_TIME);

    const matched = useSelector(selectMatchedTrashItemsWithOptimistic(debouncedSearch));

    return {
        filtering,
        ...matched,
    };
};
