import { memo, useCallback, useEffect } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { BulkActions } from '@proton/pass/components/Bulk/BulkActions';
import { useBulkActions } from '@proton/pass/components/Bulk/BulkSelectionActions';
import { useBulkEnabled } from '@proton/pass/components/Bulk/BulkSelectionState';
import { BulkToggle } from '@proton/pass/components/Bulk/BulkToggle';
import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { SortFilter } from '@proton/pass/components/Item/Filters/Sort';
import { TypeFilter } from '@proton/pass/components/Item/Filters/Type';
import { ItemsListBase } from '@proton/pass/components/Item/List/ItemsListBase';
import { ItemsListPlaceholder } from '@proton/pass/components/Item/List/ItemsListPlaceholder';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import { useNavigationMatches } from '@proton/pass/components/Navigation/NavigationMatches';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import { saveFilters } from '@proton/pass/store/actions/creators/filters';
import { selectIsWritableShare } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ItemSortFilter, ItemTypeFilter } from '@proton/pass/types';
import { type ItemRevision } from '@proton/pass/types';

export const ItemsList = memo(() => {
    const store = useStore<State>();
    const dispatch = useDispatch();

    const items = useItems();
    const selectedItem = useSelectedItem();
    const bulk = useBulkActions();
    const bulkEnabled = useBulkEnabled();

    const selectItem = useSelectItemAction();
    const { matchTrash } = useNavigationMatches();
    const { filters, setFilters } = useNavigationFilters();
    const filtersRef = useStatefulRef(filters);

    const handleSelect = useCallback(
        (item: ItemRevision, metaKey: boolean) => {
            if (metaKey || bulkEnabled) {
                if (selectIsWritableShare(item.shareId)(store.getState())) {
                    if (!bulkEnabled) bulk.enable();
                    bulk.toggle(item);
                }
            } else selectItem(item, { inTrash: isTrashed(item) });
        },
        [bulkEnabled]
    );

    const disabled = items.filtered.length === 0;
    const empty = items.totalCount === 0;

    useEffect(bulk.disable, [selectedItem, matchTrash]);

    const onChangeTypeFilter = useCallback((type: ItemTypeFilter) => setFilters({ type }), []);
    const onChangeSortFilter = useCallback((sort: ItemSortFilter) => {
        /** Extension leverages `usePopupStateEffects` to keep track
         * of filters for each individual tab */
        if (!EXTENSION_BUILD) dispatch(saveFilters({ ...filtersRef.current, sort }));
        setFilters({ sort });
    }, []);

    return (
        <>
            {!empty && (
                <div className="flex flex-row grow-0 shrink-0 flex-nowrap p-3 gap-1 overflow-x-auto justify-space-between">
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
                </div>
            )}
            <ItemsListBase
                filters={filters}
                items={items.filtered}
                totalCount={items.totalCount}
                onFilter={setFilters}
                onSelect={handleSelect}
                selectedItem={selectedItem}
                placeholder={() => <ItemsListPlaceholder />}
            />
        </>
    );
});

ItemsList.displayName = 'ItemsListMemo';
