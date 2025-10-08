import { type FC, type ReactElement, useEffect, useMemo, useRef } from 'react';
import { useStore } from 'react-redux';
import type { List } from 'react-virtualized';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import { useBulkEnabled, useBulkSelection } from '@proton/pass/components/Bulk/BulkSelectionState';
import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsListItem';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { useItemDrag } from '@proton/pass/hooks/useItemDrag';
import { isTrashed, itemEq } from '@proton/pass/lib/items/item.predicates';
import { getItemKey, interpolateRecentItems } from '@proton/pass/lib/items/item.utils';
import { selectIsWritableVault } from '@proton/pass/store/selectors';
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
    placeholder: ReactElement;
};

/** Block trashed or non-writable items from being dragged */
const assertDraggable = (item: ItemRevision, state: State) => {
    if (isTrashed(item)) return false;
    const writable = selectIsWritableVault(item.shareId)(state);
    if (!writable) return false;
    return true;
};

export const ItemsListBase: FC<Props> = ({ items, filters, selectedItem, onSelect, placeholder }) => {
    const store = useStore<State>();
    const listRef = useRef<List>(null);
    const bulk = useBulkSelection();
    const bulkEnabled = useBulkEnabled();
    const { draggable, handleDragStart, handleDragEnd } = useItemDrag();

    useEffect(() => listRef.current?.scrollToRow(0), [filters.type, filters.sort, filters.selectedShareId]);

    const { interpolation, interpolationIndexes } = useMemo(
        () => interpolateRecentItems(items)(filters.sort === 'recent'),
        [filters.type, filters.sort, items]
    );

    return (
        <>
            {items.length === 0 ? (
                <Scroll className="pass-items-list--placeholder">
                    <div className={clsx('flex justify-center items-center w-full m-auto pt-8 pb-14 min-h-full')}>
                        {placeholder}
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
                                const { shareId, itemId } = item;
                                const bulkSelected = bulk.selection.get(shareId)?.has(itemId) ?? false;

                                return (
                                    <div style={style} key={key}>
                                        <ItemsListItem
                                            bulk={bulkEnabled}
                                            selected={bulkEnabled && bulkSelected}
                                            active={!bulkEnabled && selectedItem && itemEq(selectedItem)(item)}
                                            id={id}
                                            item={item}
                                            key={id}
                                            search={filters.search}
                                            draggable={draggable && assertDraggable(item, store.getState())}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                            onSelect={onSelect}
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
