import { type FC, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';
import type { List } from 'react-virtualized';

import { c, msgid } from 'ttag';

import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsListItem';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { getItemRoute } from '@proton/pass/components/Navigation/routing';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { isTrashed, itemEq } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { selectDuplicatePasswordItems } from '@proton/pass/store/selectors/monitor';
import type { ItemRevision, SelectedItem } from '@proton/pass/types';

export type InterpolationItem = { type: 'divider'; label: string } | { type: 'item'; item: ItemRevision };

const flattenWithLabelsAndIndexes = (
    items: ItemRevision[][]
): { interpolation: InterpolationItem[]; interpolationIndexes: number[] } => {
    const { interpolation, interpolationIndexes } = items.reduce<{
        interpolation: InterpolationItem[];
        interpolationIndexes: number[];
    }>(
        (acc, group) => {
            const label = c('Title').ngettext(
                msgid`Reused ${group.length} time`,
                `Reused ${group.length} times`,
                group.length
            );
            acc.interpolationIndexes.push(acc.interpolation.length);
            acc.interpolation.push(
                { type: 'divider', label: label },
                ...group.map<InterpolationItem>((item) => ({ type: 'item', item: item }))
            );
            return acc;
        },
        { interpolation: [], interpolationIndexes: [] }
    );

    return { interpolation, interpolationIndexes };
};

export const DuplicatePasswords: FC = () => {
    const selectItem = useSelectItemAction();
    const itemRoute = getItemRoute(':shareId', ':itemId', { prefix: 'monitor/duplicates(/trash)?' });
    const selectedItem = useRouteMatch<SelectedItem>(itemRoute)?.params;
    const duplicatePasswordItems = useSelector(selectDuplicatePasswordItems);

    const listRef = useRef<List>(null);
    const { interpolation, interpolationIndexes } = useMemo(
        () => flattenWithLabelsAndIndexes(duplicatePasswordItems),
        [duplicatePasswordItems]
    );

    useEffect(() => {
        if (duplicatePasswordItems.length && !selectedItem) {
            const item = duplicatePasswordItems[0][0];
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
    ) : null;
};
