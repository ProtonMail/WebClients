import { type FC } from 'react';

import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { SortFilter } from '@proton/pass/components/Item/Filters/Sort';
import { TypeFilter } from '@proton/pass/components/Item/Filters/Type';
import { ItemsListBase } from '@proton/pass/components/Item/List/ItemsListBase';
import { ItemsListPlaceholder } from '@proton/pass/components/Item/List/ItemsListPlaceholder';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';

export const ItemsList: FC = () => {
    const { filters, matchTrash, selectedItem, setFilters } = useNavigation();
    const items = useItems();
    const selectItem = useSelectItemAction();

    return (
        <>
            {!matchTrash && items.totalCount > 0 && (
                <div className="flex flex-row grow-0 shrink-0 flex-nowrap p-3 gap-1 overflow-x-auto">
                    <TypeFilter items={items.searched} value={filters.type} onChange={(type) => setFilters({ type })} />
                    <SortFilter value={filters.sort} onChange={(sort) => setFilters({ sort })} />
                </div>
            )}

            <ItemsListBase
                filters={filters}
                items={items.filtered}
                totalCount={items.totalCount}
                onFilter={setFilters}
                onSelect={(item) => selectItem(item, { inTrash: matchTrash })}
                selectedItem={selectedItem}
                placeholder={() => <ItemsListPlaceholder />}
            />
        </>
    );
};
