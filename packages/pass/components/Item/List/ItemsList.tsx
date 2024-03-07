import { type FC, useEffect } from 'react';

import { BulkActions } from '@proton/pass/components/Bulk/BulkActions';
import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { BulkToggle } from '@proton/pass/components/Bulk/BulkToggle';
import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { SortFilter } from '@proton/pass/components/Item/Filters/Sort';
import { TypeFilter } from '@proton/pass/components/Item/Filters/Type';
import { ItemsListBase } from '@proton/pass/components/Item/List/ItemsListBase';
import { ItemsListPlaceholder } from '@proton/pass/components/Item/List/ItemsListPlaceholder';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { type ItemRevision } from '@proton/pass/types';

export const ItemsList: FC = () => {
    const { filters, matchTrash, selectedItem, setFilters } = useNavigation();
    const items = useItems();
    const selectItem = useSelectItemAction();
    const bulk = useBulkSelect();

    const handleSelect = (item: ItemRevision, metaKey: boolean) => {
        const bulkAction = metaKey && !bulk.enabled;
        if (bulkAction) bulk.enable();
        if (bulk.enabled || bulkAction) bulk[bulk.isSelected(item) ? 'unselect' : 'select'](item);
        else selectItem(item, { inTrash: matchTrash });
    };

    const disabled = items.filtered.length === 0;
    const empty = items.totalCount === 0;

    useEffect(bulk.disable, [selectedItem, matchTrash]);

    return (
        <>
            {!empty && (
                <div className="flex flex-row grow-0 shrink-0 flex-nowrap p-3 gap-1 overflow-x-auto justify-space-between">
                    <div className="flex flex-1 gap-1 shrink-0 flex-nowrap">
                        {!bulk.enabled && (
                            <>
                                <TypeFilter
                                    items={items.searched}
                                    value={filters.type}
                                    onChange={(type) => setFilters({ type })}
                                />
                                <SortFilter value={filters.sort} onChange={(sort) => setFilters({ sort })} />
                            </>
                        )}
                        {bulk.enabled && <BulkActions disabled={disabled} />}
                    </div>
                    <BulkToggle disabled={!bulk.enabled && disabled} />
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
};
