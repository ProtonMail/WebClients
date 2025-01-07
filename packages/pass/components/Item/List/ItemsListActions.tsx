import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { BulkActions } from '@proton/pass/components/Bulk/BulkActions';
import { useBulkActions } from '@proton/pass/components/Bulk/BulkSelectionActions';
import { useBulkEnabled } from '@proton/pass/components/Bulk/BulkSelectionState';
import { BulkToggle } from '@proton/pass/components/Bulk/BulkToggle';
import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { SortFilter } from '@proton/pass/components/Item/Filters/Sort';
import { TypeFilter } from '@proton/pass/components/Item/Filters/Type';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
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

    useEffect(bulk.disable, [selectedItem, scope]);

    const onChangeTypeFilter = useCallback((type: ItemTypeFilter) => setFilters({ type }), []);
    const onChangeSortFilter = useCallback((sort: ItemSortFilter) => {
        /** Extension leverages `usePopupStateEffects` to keep track
         * of filters for each individual tab */
        if (!EXTENSION_BUILD) dispatch(saveFilters({ ...filtersRef.current, sort }));
        setFilters({ sort });
    }, []);

    return (
        <>
            <div className="flex flex-1 gap-1 shrink-0 flex-nowrap">
                {!bulkEnabled && (
                    <>
                        <TypeFilter items={items.searched} value={filters.type} onChange={onChangeTypeFilter} />
                        <SortFilter value={filters.sort} onChange={onChangeSortFilter} />
                    </>
                )}
                {bulkEnabled && <BulkActions disabled={disabled} />}
            </div>
            <BulkToggle disabled={!bulkEnabled && disabled} />
        </>
    );
};
