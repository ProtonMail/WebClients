import { type FC, type ReactElement, useEffect, useMemo, useRef } from 'react';
import type { List } from 'react-virtualized';

import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsList.Item';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { interpolateRecentItems } from '@proton/pass/lib/items/item.utils';
import type { ItemFilters, ItemRevisionWithOptimistic, SelectedItem } from '@proton/pass/types';

type Props = {
    filters: ItemFilters;
    items: ItemRevisionWithOptimistic[];
    selectedItem?: SelectedItem;
    totalCount: number;
    onFilter: (update: Partial<ItemFilters>) => void;
    onSelect: (shareId: string, itemId: string) => void;
    placeholder: () => ReactElement;
};

export const ItemsList: FC<Props> = ({ items, filters, selectedItem, onSelect, placeholder }) => {
    const listRef = useRef<List>(null);

    useEffect(() => listRef.current?.scrollToRow(0), [filters.type, filters.sort]);

    const { interpolation, interpolationIndexes } = useMemo(
        () => interpolateRecentItems(items)(filters.sort === 'recent'),
        [filters.type, filters.sort, items]
    );

    return (
        <>
            {items.length === 0 ? (
                <div className="flex flex-justify-center flex-align-items-center w-full m-auto overflow-x-auto py-3">
                    {placeholder()}
                </div>
            ) : (
                <VirtualList
                    ref={listRef}
                    rowCount={interpolation.length}
                    interpolationIndexes={interpolationIndexes}
                    rowRenderer={({ style, index, key }) => {
                        const row = interpolation[index];

                        switch (row.type) {
                            case 'entry': {
                                const item = row.entry;
                                return (
                                    <div style={style} key={key}>
                                        <ItemsListItem
                                            item={item}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onSelect(item.shareId, item.itemId);
                                            }}
                                            id={`item-${item.shareId}-${item.itemId}`}
                                            search={filters.search}
                                            active={selectedItem && itemEq(selectedItem)(item)}
                                        />
                                    </div>
                                );
                            }
                            case 'interpolation': {
                                return (
                                    <div style={style} key={key} className="flex color-weak text-sm pt-2 pb-1 pl-3">
                                        {row.cluster.label}
                                    </div>
                                );
                            }
                        }
                    }}
                />
            )}
        </>
    );
};
