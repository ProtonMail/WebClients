import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { BulkActions } from '@proton/pass/components/Bulk/BulkActions';
import { useBulkActions } from '@proton/pass/components/Bulk/BulkSelectionActions';
import { useBulkEnabled } from '@proton/pass/components/Bulk/BulkSelectionState';
import { BulkToggle } from '@proton/pass/components/Bulk/BulkToggle';
import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { ResetFiltersButton } from '@proton/pass/components/Item/Filters/ResetFiltersButton';
import { SortFilter } from '@proton/pass/components/Item/Filters/Sort';
import { TypeFilter } from '@proton/pass/components/Item/Filters/Type';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import { intoDisplayedSortFilter } from '@proton/pass/lib/items/item.utils';
import { saveFilters } from '@proton/pass/store/actions/creators/filters';
import type { ItemSortFilter, ItemTypeFilter } from '@proton/pass/types';

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
