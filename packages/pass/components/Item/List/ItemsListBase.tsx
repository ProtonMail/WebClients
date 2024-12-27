import { type DragEvent, type FC, type ReactElement, useEffect, useMemo, useRef } from 'react';
import { useStore } from 'react-redux';
import type { List } from 'react-virtualized';

import { Scroll } from '@proton/atoms';
import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsListItem';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { useItemDrag } from '@proton/pass/hooks/useItemDrag';
import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { getItemKey, interpolateRecentItems } from '@proton/pass/lib/items/item.utils';
import { selectIsWritableShare } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ItemFilters, ItemRevision, SelectedItem } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './ItemsListBase.scss';

type Props = {
    filters: ItemFilters;
    items: ItemRevision[];
    selectedItem?: SelectedItem;
    totalCount: number;
    onFilter: (update: Partial<ItemFilters>) => void;
    onSelect: (item: ItemRevision, metaKey: boolean) => void;
    placeholder: () => ReactElement;
};

export const ItemsListBase: FC<Props> = ({ items, filters, selectedItem, onSelect, placeholder }) => {
    const store = useStore<State>();
    const listRef = useRef<List>(null);
    const bulk = useBulkSelect();
    const { draggable, handleDragStart, handleDragEnd } = useItemDrag();

    useEffect(() => listRef.current?.scrollToRow(0), [filters.type, filters.sort]);

    const { interpolation, interpolationIndexes } = useMemo(
        () => interpolateRecentItems(items)(filters.sort === 'recent'),
        [filters.type, filters.sort, items]
    );

    return (
        <>
            {items.length === 0 ? (
                <Scroll className="pass-items-list--placeholder">
                    <div className={clsx('flex justify-center items-center w-full m-auto pt-8 pb-14 min-h-full')}>
                        {placeholder()}
                    </div>
                </Scroll>
            ) : (
                <VirtualList
                    interpolationIndexes={interpolationIndexes}
                    ref={listRef}
                    rowCount={interpolation.length}
                    rowHeight={(idx) => (interpolationIndexes.includes(idx) ? 28 : 54)}
                    rowRenderer={({ style, index, key }) => {
                        const row = interpolation[index];

                        switch (row.type) {
                            case 'entry': {
                                const item = row.entry;
                                const id = getItemKey(item);

                                const onDragStart = (evt: DragEvent) => {
                                    if (handleDragStart && draggable) {
                                        const writable = selectIsWritableShare(item.shareId)(store.getState());
                                        if (writable) handleDragStart?.(evt, { ID: id });
                                        else return false;
                                    }
                                };

                                return (
                                    <div style={style} key={key}>
                                        <ItemsListItem
                                            active={!bulk.enabled && selectedItem && itemEq(selectedItem)(item)}
                                            id={id}
                                            item={item}
                                            key={id}
                                            search={filters.search}
                                            draggable={draggable}
                                            onDragStart={onDragStart}
                                            onDragEnd={handleDragEnd}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onSelect(item, e.ctrlKey || e.metaKey);
                                            }}
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
