import { type VFC, useEffect, useMemo, useRef } from 'react';
import type { List } from 'react-virtualized';

import { interpolateRecentItems, itemEq } from '@proton/pass/utils/pass/items';

import { ListItemLink } from '../../../shared/components/router';
import { ItemsListItem } from '../../components/Item/ItemsListItem';
import { VirtualList } from '../../components/List/VirtualList';
import { useItems } from '../../hooks/useItems';
import { useNavigationContext } from '../../hooks/useNavigationContext';
import { useSelectItemClick } from '../../hooks/useSelectItemClick';
import { ItemsFilter } from './ItemsFilter';
import { ItemsListPlaceholder } from './ItemsListPlaceholder';
import { ItemsSort } from './ItemsSort';

export const ItemsList: VFC = () => {
    const { selectedItem } = useNavigationContext();
    const onSelectItem = useSelectItemClick();

    const {
        filtering: { search, type, sort, setSort, setType },
        filtered,
        totalCount,
    } = useItems();

    const listRef = useRef<List>(null);
    useEffect(() => listRef.current?.scrollToRow(0), [type, sort]);

    const { interpolation, interpolationIndexes } = useMemo(
        () => interpolateRecentItems(filtered)(sort === 'recent'),
        [filtered, sort]
    );

    return (
        <>
            {totalCount > 0 && (
                <div className="flex flex-row flex-item-nogrow flex-item-noshrink flex-nowrap p-3 gap-1 scroll-horizontal-if-needed">
                    <ItemsFilter value={type} onChange={setType} />
                    <ItemsSort sort={sort} onSortChange={setSort} />
                </div>
            )}

            {filtered.length === 0 ? (
                <div className="absolute-center flex flex-justify-center flex-align-items-center w70">
                    <ItemsListPlaceholder />
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
                                            component={ListItemLink}
                                            onClick={onSelectItem(item)}
                                            id={`item-${item.shareId}-${item.itemId}`}
                                            search={search}
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
