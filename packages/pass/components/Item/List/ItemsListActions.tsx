import { useCallback, useEffect, useMemo } from 'react';

import { intoDisplayedSortFilter } from '../../../lib/items/item.utils';
import type { ItemSortFilter, ItemTypeFilter } from '../../../types/data/items';
import { BulkActions } from '../../Bulk/BulkActions';
import { useBulkActions } from '../../Bulk/BulkSelectionActions';
import { useBulkEnabled } from '../../Bulk/BulkSelectionState';
import { BulkToggle } from '../../Bulk/BulkToggle';
import { useNavigationFilters } from '../../Navigation/NavigationFilters';
import { useSelectedItem } from '../../Navigation/NavigationItem';
import { useItemScope } from '../../Navigation/NavigationMatches';
import { useItems } from '../Context/ItemsProvider';
import { ResetFiltersButton } from '../Filters/ResetFiltersButton';
import { SortFilter } from '../Filters/Sort';
import { TypeFilter } from '../Filters/Type';

export const ItemsListActions = () => {
    const items = useItems();
    const selectedItem = useSelectedItem();
    const bulk = useBulkActions();
    const bulkEnabled = useBulkEnabled();

    const scope = useItemScope();
    const { filters, setFilters } = useNavigationFilters();

    const disabled = items.filtered.length === 0;
    const hasSearch = Boolean(filters.search);

    const hasActiveFilters = useMemo(
        () => filters.type !== '*' || intoDisplayedSortFilter(filters.sort, hasSearch) !== 'recent',
        [filters.type, filters.sort, hasSearch]
    );

    useEffect(bulk.disable, [selectedItem, scope]);

    const onChangeTypeFilter = useCallback((type: ItemTypeFilter) => setFilters({ type }), []);
    const onChangeSortFilter = useCallback((sort: ItemSortFilter) => setFilters({ sort }), []);
    const onResetFilters = useCallback(() => setFilters({ type: '*', sort: 'recent' }), []);

    return (
        <div className="flex flex-column gap-1 w-full min-w-0">
            <div className="flex flex-nowrap gap-1 justify-space-between w-full min-w-0">
                <div className="flex flex-1 gap-1 shrink-0 flex-nowrap min-w-0 overflow-x-auto">
                    {!bulkEnabled && (
                        <>
                            <TypeFilter items={items.searched} value={filters.type} onChange={onChangeTypeFilter} />
                            <SortFilter value={filters.sort} onChange={onChangeSortFilter} hasSearch={hasSearch} />
                        </>
                    )}
                    {bulkEnabled && <BulkActions disabled={disabled} />}
                </div>
                <BulkToggle disabled={!bulkEnabled && disabled} />
            </div>
            {!bulkEnabled && hasActiveFilters && <ResetFiltersButton onClick={onResetFilters} />}
        </div>
    );
};
