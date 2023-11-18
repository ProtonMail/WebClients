import { useSelector } from 'react-redux';

import { selectItemsSearchResult } from '../store/selectors';
import { type PassFilters } from './useFilters';

export const useFilteredItems = (filters: PassFilters) =>
    useSelector(
        selectItemsSearchResult({
            itemType: filters.type === '*' ? null : filters.type,
            search: filters.search,
            shareId: filters.selectedShareId,
            sort: filters.sort,
        })
    );
