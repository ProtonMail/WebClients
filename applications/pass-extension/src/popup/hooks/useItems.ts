import { useFilteredItems } from './useFilteredItems';
import { useItemsFilteringContext } from './useItemsFilteringContext';

export const useItems = () => {
    const filtering = useItemsFilteringContext();
    const { items, trash } = useFilteredItems(filtering);

    return { filtering, items, trash };
};
