import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { useStatefulRef } from '../../../hooks/useStatefulRef';
import { intoDisplayedSortFilter } from '../../../lib/items/item.utils';
import { saveFilters } from '../../../store/actions/creators/filters';
import type { ItemSortFilter, ItemTypeFilter } from '../../../types';
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
    const dispatch = useDispatch();

    const items = useItems();
    const selectedItem = useSelectedItem();
    const bulk = useBulkActions();
    const bulkEnabled = useBulkEnabled();

    const scope = useItemScope();
    const { filters, setFilters } = useNavigationFilters();
    const filtersRef = useStatefulRef(filters);

    const disabled = items.filtered.length === 0;
    const hasSearch = Boolean(filters.search);

    const hasActiveFilters = useMemo(
        () => filters.type !== '*' || intoDisplayedSortFilter(filters.sort, hasSearch) !== 'recent',
        [filters.type, filters.sort, hasSearch]
    );

    useEffect(bulk.disable, [selectedItem, scope]);

    const onChangeTypeFilter = useCallback((type: ItemTypeFilter) => setFilters({ type }), []);
    const onChangeSortFilter = useCallback((sort: ItemSortFilter) => {
        /** Extension leverages `usePopupStateEffects` to keep track
         * of filters for each individual tab */
        if (!EXTENSION_BUILD) dispatch(saveFilters({ ...filtersRef.current, sort }));
        setFilters({ sort });
    }, []);

    const onResetFilters = useCallback(() => {
        const next = { type: '*' as const, sort: 'recent' as const };

        if (!EXTENSION_BUILD) dispatch(saveFilters({ ...filtersRef.current, ...next }));
        setFilters(next);
    }, []);

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
