import { type FC } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { getItemRoute, getTrashRoute } from '@proton/pass/components/Core/routing';
import { SortFilter } from '@proton/pass/components/Item/Filters/Sort';
import { TypeFilter } from '@proton/pass/components/Item/Filters/Type';
import { ItemsList } from '@proton/pass/components/Item/List/ItemsList';
import { type ItemRouteParams } from '@proton/pass/components/Views/types';
import { useFilteredItems } from '@proton/pass/hooks/useFilteredItems';

import { ItemsPlaceholder } from './Placeholder';

export const Items: FC = () => {
    const { filters, setFilters, selectItem } = useNavigation();
    const inTrash = useRouteMatch(getTrashRoute()) !== null;
    const itemMatch = useRouteMatch<ItemRouteParams>(getItemRoute(':shareId', ':itemId', inTrash));
    const items = useFilteredItems({ ...filters, trashed: inTrash });

    return (
        <>
            {items.totalCount > 0 && (
                <div className="flex flex-row flex-item-nogrow flex-item-noshrink flex-nowrap p-3 gap-1 scroll-horizontal-if-needed">
                    <TypeFilter items={items.searched} value={filters.type} onChange={(type) => setFilters({ type })} />
                    <SortFilter value={filters.sort} onChange={(sort) => setFilters({ sort })} />
                </div>
            )}

            <ItemsList
                filters={filters}
                items={items.filtered}
                totalCount={items.totalCount}
                onFilter={setFilters}
                onSelect={(shareId, itemId) => selectItem(shareId, itemId, { inTrash })}
                selectedItem={itemMatch ? itemMatch.params : undefined}
                placeholder={() => (
                    <ItemsPlaceholder inTrash={inTrash} search={filters.search} totalCount={items.totalCount} />
                )}
            />
        </>
    );
};
