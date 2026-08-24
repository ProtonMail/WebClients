import type { MouseEvent } from 'react';
import { type FC, type ReactElement, useCallback, useEffect, useMemo, useRef } from 'react';
import { useStore } from 'react-redux';
import type { List } from 'react-virtualized';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import clsx from '@proton/utils/clsx';

import { useItemDrag } from '../../../hooks/useItemDrag';
import { isTrashed, itemEq } from '../../../lib/items/item.predicates';
import { getItemKey, interpolateRecentItems, intoDisplayedSortFilter } from '../../../lib/items/item.utils';
import { selectIsWritableVault } from '../../../store/selectors';
import type { State } from '../../../store/types';
import type { ItemFilters, ItemRevision, SelectedItem } from '../../../types';
import { useBulkEnabled, useBulkSelection } from '../../Bulk/BulkSelectionState';
import { useContextMenu } from '../../ContextMenu/ContextMenuProvider';
import { VirtualList } from '../../Layout/List/VirtualList';
import { ItemsListContextMenu, useItemContextMenu } from '../ContextMenu/ItemsListContextMenu';
import { ItemsListItem } from './ItemsListItem';

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
    const { close } = useContextMenu();

    const containerRef = useRef<HTMLDivElement>(null);

    const { item: contextMenuItem, onContextMenu } = useItemContextMenu();

    useEffect(() => listRef.current?.scrollToRow(0), [filters.type, filters.sort, filters.selectedShareId]);

    const { interpolation, interpolationIndexes } = useMemo(
        /* Date sections follow recency: `relevant` degrades to `recent` while
         * browsing (no active search); a `relevant` search ranks by relevance,
         * so date labels are hidden. */
        () =>
            interpolateRecentItems(items)(intoDisplayedSortFilter(filters.sort, Boolean(filters.search)) === 'recent'),
        [filters.type, filters.sort, filters.search, items]
    );

    const handleContextMenu = useCallback(
        (item: ItemRevision, bulkSelected: boolean) => (event: MouseEvent) => {
            /** Active context menu if no bulk or if bulk and over one of the selected items */
            if (!bulkEnabled || bulkSelected) return onContextMenu(event, item);
        },
        [bulkEnabled, bulk]
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
                    containerRef={containerRef}
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
                                            onContextMenu={handleContextMenu(item, bulkSelected)}
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
                    onScroll={close}
                />
            )}
            {contextMenuItem && <ItemsListContextMenu anchorRef={containerRef} {...contextMenuItem} />}
        </>
    );
};
