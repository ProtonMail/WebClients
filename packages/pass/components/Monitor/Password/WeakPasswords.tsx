import { type FC, useEffect, useRef } from 'react';
import { useRouteMatch } from 'react-router-dom';
import type { List } from 'react-virtualized';

import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsListItem';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { getItemRoute } from '@proton/pass/components/Navigation/routing';
import { useWeakPasswords } from '@proton/pass/hooks/monitor/useWeakPasswords';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { isTrashed, itemEq } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import type { SelectedItem } from '@proton/pass/types';

export const WeakPasswords: FC = () => {
    const selectItem = useSelectItemAction();
    const itemRoute = getItemRoute(':shareId', ':itemId', { prefix: 'monitor/weak(/trash)?' });
    const selectedItem = useRouteMatch<SelectedItem>(itemRoute)?.params;
    const weakItems = useWeakPasswords();
    const listRef = useRef<List>(null);

    useEffect(() => {
        if (weakItems.length && !selectedItem) {
            const item = weakItems[0];
            selectItem(item, { inTrash: isTrashed(item), prefix: 'monitor/weak', mode: 'replace' });
        }
    }, [selectedItem, weakItems]);

    return weakItems.length ? (
        <VirtualList
            ref={listRef}
            rowCount={weakItems.length}
            rowHeight={() => 54}
            rowRenderer={({ style, index, key }) => {
                const item = weakItems[index];
                const id = getItemKey(item);

                return (
                    <div style={style} key={key}>
                        <ItemsListItem
                            active={selectedItem && itemEq(selectedItem)(item)}
                            id={id}
                            item={item}
                            key={id}
                            onClick={(e) => {
                                e.preventDefault();
                                selectItem(item, {
                                    inTrash: isTrashed(item),
                                    prefix: 'monitor/weak',
                                });
                            }}
                        />
                    </div>
                );
            }}
        />
    ) : null;
};
