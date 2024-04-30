import { type FC, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';
import type { List } from 'react-virtualized';

import { c, msgid } from 'ttag';

import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsListItem';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';
import { getItemRoute } from '@proton/pass/components/Navigation/routing';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { isTrashed, itemEq } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { selectOptimisticItemsFactory, selectSelectedItems } from '@proton/pass/store/selectors';
import type { ItemRevisionWithOptimistic, SelectedItem, UniqueItem } from '@proton/pass/types';

type InterpolationItem = { type: 'divider'; label: string } | { type: 'item'; item: ItemRevisionWithOptimistic };
type Interpolation = { interpolation: InterpolationItem[]; interpolationIndexes: number[]; sliceAt: number };

const getLabel = (count: number) => c('Title').ngettext(msgid`Reused ${count} time`, `Reused ${count} times`, count);
const interpolateDuplicates = (groups: UniqueItem[][], items: ItemRevisionWithOptimistic[]): Interpolation =>
    groups.reduce<Interpolation>(
        (acc, group) => {
            const start = acc.sliceAt;
            const end = acc.sliceAt + group.length;
            const slice = items.slice(start, end).map<InterpolationItem>((item) => ({ type: 'item', item }));

            acc.interpolationIndexes.push(acc.interpolation.length);
            acc.interpolation.push({ type: 'divider', label: getLabel(group.length) }, ...slice);
            acc.sliceAt = end;

            return acc;
        },
        { interpolation: [], interpolationIndexes: [], sliceAt: 0 }
    );

export const DuplicatePasswords: FC = () => {
    const listRef = useRef<List>(null);
    const selectItem = useSelectItemAction();

    const monitor = useMonitor();
    const duplicates = useMemo(() => monitor.duplicates.data.flat(), [monitor.duplicates.data]);
    const duplicatePasswordItems = useSelector(selectOptimisticItemsFactory(selectSelectedItems(duplicates)));
    const itemRoute = getItemRoute(':shareId', ':itemId', { prefix: 'monitor/duplicates(/trash)?' });
    const selectedItem = useRouteMatch<SelectedItem>(itemRoute)?.params;

    const { interpolation, interpolationIndexes } = useMemo(
        () => interpolateDuplicates(monitor.duplicates.data, duplicatePasswordItems),
        [duplicatePasswordItems, duplicates]
    );

    useEffect(() => {
        if (duplicatePasswordItems.length && !selectedItem) {
            const item = duplicatePasswordItems[0];
            selectItem(item, { inTrash: isTrashed(item), prefix: 'monitor/duplicates', mode: 'replace' });
        }
    }, [selectedItem, duplicatePasswordItems]);

    return interpolation.length > 0 ? (
        <VirtualList
            interpolationIndexes={interpolationIndexes}
            ref={listRef}
            rowCount={interpolation.length}
            rowHeight={(idx) => (interpolationIndexes.includes(idx) ? 28 : 54)}
            rowRenderer={({ style, index, key }) => {
                const row = interpolation[index];
                switch (row.type) {
                    case 'item': {
                        const item = row.item;
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
                                            prefix: 'monitor/duplicates',
                                        });
                                    }}
                                />
                            </div>
                        );
                    }
                    case 'divider': {
                        return (
                            <div style={style} key={key} className="flex color-weak text-sm pt-2 pb-1 pl-3">
                                {row.label}
                            </div>
                        );
                    }
                }
            }}
        />
    ) : (
        <div className="flex items-center justify-center color-weak text-sm text-center text-break h-full">
            <strong>{c('Title').t`No reused passwords`}</strong>
        </div>
    );
};
