import { type FC, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { List } from 'react-virtualized';

import { c, msgid } from 'ttag';

import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsListItem';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { SubHeader } from '@proton/pass/components/Layout/Section/SubHeader';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { selectDuplicatePasswordItems } from '@proton/pass/store/selectors/monitor';
import type { ItemRevision } from '@proton/pass/types';

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
    const duplicatePasswordItems = useSelector(selectDuplicatePasswordItems);
    const selectItem = useSelectItemAction();
    const listRef = useRef<List>(null);
    const { interpolation, interpolationIndexes } = useMemo(
        () => flattenWithLabelsAndIndexes(duplicatePasswordItems),
        [duplicatePasswordItems]
    );

    return (
        <div className="min-h-custom" style={{ '--min-h-custom': '80vh' }}>
            <SubHeader
                title={c('Title').t`Reused passwords`}
                description={c('Description').t`Generate unique passwords to increase your security.`}
            />

            {duplicatePasswordItems.length > 0 && (
                <div className="h-custom" style={{ '--h-custom': 'max(calc(100vh - 180px), 18.75rem)' }}>
                    <VirtualList
                        interpolationIndexes={interpolationIndexes}
                        ref={listRef}
                        rowCount={interpolation.length}
                        rowHeight={(idx) => (interpolationIndexes.includes(idx) ? 60 : 54)}
                        rowRenderer={({ style, index, key }) => {
                            const row = interpolation[index];
                            switch (row.type) {
                                case 'item': {
                                    const item = row.item;
                                    const id = getItemKey(item);
                                    return (
                                        <div style={style} key={key}>
                                            <ItemsListItem
                                                id={id}
                                                item={item}
                                                key={id}
                                                onClick={() => selectItem(row.item, { inTrash: isTrashed(row.item) })}
                                            />
                                        </div>
                                    );
                                }
                                case 'divider': {
                                    return (
                                        <div
                                            style={style}
                                            key={key}
                                            className="flex color-weak text-xl pt-6 pb-3 pl-3 items-center"
                                        >
                                            {row.label}
                                        </div>
                                    );
                                }
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};
