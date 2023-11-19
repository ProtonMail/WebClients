import { useSelector } from 'react-redux';

import { selectItemsSearchResult } from '@proton/pass/store/selectors';
import type { ItemFilters } from '@proton/pass/types';

export const useFilteredItems = (filters: ItemFilters) =>
    useSelector(
        selectItemsSearchResult({
            itemType: filters.type === '*' ? null : filters.type,
            search: filters.search,
            shareId: filters.selectedShareId,
            sort: filters.sort,
        })
    );
