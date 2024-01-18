import { type FC, useEffect } from 'react';

import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { SortFilter } from '@proton/pass/components/Item/Filters/Sort';
import { TypeFilter } from '@proton/pass/components/Item/Filters/Type';
import { ItemsListBase } from '@proton/pass/components/Item/List/ItemsListBase';
import { ItemsListPlaceholder } from '@proton/pass/components/Item/List/ItemsListPlaceholder';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { type ItemRevision, type SelectedItem } from '@proton/pass/types';

import { BulkActions } from '../../Bulk/BulkActions';
import { BulkToggle } from '../../Bulk/BulkToggle';

export const ItemsList: FC = () => {
    const { filters, matchTrash, selectedItem, setFilters } = useNavigation();
    const items = useItems();
    const selectItem = useSelectItemAction();
    const bulk = useBulkSelect();

    const handleSelect = (item: ItemRevision) => {
        const currentItem = { itemId: item.itemId, shareId: item.shareId } as SelectedItem;
        if (bulk.isBulk) {
            if (bulk.isSelected(currentItem)) {
                bulk.unselectItem(currentItem);
            } else {
                bulk.selectItem(currentItem);
            }
        } else {
            selectItem(item, { inTrash: matchTrash });
        }
    };

    useEffect(bulk.disable, [selectedItem, matchTrash]);

    const disableFilters = !matchTrash && items.totalCount;

    return (
        <>
            <div className="flex flex-row grow-0 shrink-0 flex-nowrap p-3 gap-1 overflow-x-auto space-between">
                <div className="flex gap-1 shrink-0 flex-1">
                    {!bulk.isBulk && disableFilters && (
                        <>
                            <TypeFilter
                                items={items.searched}
                                value={filters.type}
                                onChange={(type) => setFilters({ type })}
                            />
                            <SortFilter value={filters.sort} onChange={(sort) => setFilters({ sort })} />
                        </>
                    )}
                    {bulk.isBulk && <BulkActions />}
                </div>
                <BulkToggle />
            </div>
            <ItemsListBase
                filters={filters}
                items={items.filtered}
                totalCount={items.totalCount}
                onFilter={setFilters}
                onSelect={(item) => handleSelect(item)}
                selectedItem={selectedItem}
                placeholder={() => <ItemsListPlaceholder />}
            />
        </>
    );
};
