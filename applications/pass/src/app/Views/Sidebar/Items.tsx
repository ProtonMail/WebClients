import { type FC } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { SortFilter } from '@proton/pass/components/Item/Filters/Sort';
import { TypeFilter } from '@proton/pass/components/Item/Filters/Type';
import { ItemsList } from '@proton/pass/components/Item/List/ItemsList';
import { type ItemRouteParams } from '@proton/pass/components/Views/types';
import { useFilteredItems } from '@proton/pass/hooks/useFilteredItems';

export const Items: FC = () => {
    const { filters, setFilters, selectItem } = useNavigation();
    const match = useRouteMatch<ItemRouteParams>(`/u/*/share/:shareId/item/:itemId`);
    const items = useFilteredItems(filters);
    const search = filters.search ?? '';

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
                onSelect={selectItem}
                selectedItem={match ? match.params : undefined}
                placeholder={() => (
                    <span className="block text-break color-weak text-sm p-2 text-center text-break">
                        {search?.trim() ? (
                            <span>
                                {c('Warning').t`No items matching`}
                                <br />"{search}"
                            </span>
                        ) : (
                            c('Warning').t`No items`
                        )}
                    </span>
                )}
            />
        </>
    );
};
