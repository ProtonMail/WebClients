import { type FC, useCallback, useMemo, useRef } from 'react';
import type { List } from 'react-virtualized';

import { c, msgid } from 'ttag';

import { useAutoSelect } from '../../../hooks/items/useAutoSelect';
import { useMemoSelector } from '../../../hooks/useMemoSelector';
import { useSelectItemAction } from '../../../hooks/useSelectItemAction';
import { useTelemetryEvent } from '../../../hooks/useTelemetryEvent';
import { itemEq } from '../../../lib/items/item.predicates';
import { getItemKey } from '../../../lib/items/item.utils';
import { selectSelectedItemGroups } from '../../../store/selectors';
import type { ItemRevision } from '../../../types';
import { TelemetryEventName } from '../../../types/data/telemetry';
import { useContextMenu } from '../../ContextMenu/ContextMenuProvider';
import { usePassCore } from '../../Core/PassCoreProvider';
import { ItemsListContextMenu, useItemContextMenu } from '../../Item/ContextMenu/ItemsListContextMenu';
import { ItemsListItem } from '../../Item/List/ItemsListItem';
import { VirtualList } from '../../Layout/List/VirtualList';
import { useSelectedItem } from '../../Navigation/NavigationItem';
import { useMonitor } from '../MonitorContext';

type InterpolationItem = { type: 'divider'; label: string } | { type: 'item'; item: ItemRevision };
type Interpolation = { interpolation: InterpolationItem[]; interpolationIndexes: number[] };

const getLabel = (count: number) => c('Title').ngettext(msgid`Reused ${count} time`, `Reused ${count} times`, count);

const interpolateDuplicates = (groups: ItemRevision[][]): Interpolation =>
    groups.reduce<Interpolation>(
        (acc, group) => {
            acc.interpolationIndexes.push(acc.interpolation.length);
            acc.interpolation.push(
                { type: 'divider', label: getLabel(group.length) },
                ...group.map<InterpolationItem>((item) => ({ type: 'item', item }))
            );
            return acc;
        },
        { interpolation: [], interpolationIndexes: [] }
    );

export const DuplicatePasswords: FC = () => {
    const { onTelemetry } = usePassCore();
    const listRef = useRef<List>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectItem = useSelectItemAction();

    const { duplicates } = useMonitor();

    const groups = useMemoSelector(selectSelectedItemGroups, [duplicates.data, 'titleASC']);
    const { interpolation, interpolationIndexes } = useMemo(() => interpolateDuplicates(groups), [groups]);

    const selectedItem = useSelectedItem();
    const { close } = useContextMenu();
    const { item: contextMenuItem, onContextMenu } = useItemContextMenu();

    useAutoSelect(groups[0]?.[0]);
    useTelemetryEvent(TelemetryEventName.PassMonitorDisplayReusedPasswords, {}, {})([]);

    const onSelect = useCallback((item: ItemRevision) => {
        onTelemetry(TelemetryEventName.PassMonitorItemDetailFromReusedPassword, {}, {});
        selectItem(item, { scope: 'monitor/duplicates' });
    }, []);

    return interpolation.length > 0 ? (
        <>
            <VirtualList
                interpolationIndexes={interpolationIndexes}
                ref={listRef}
                containerRef={containerRef}
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
                                        onSelect={onSelect}
                                        onContextMenu={onContextMenu}
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
                onScroll={close}
            />
            {contextMenuItem && <ItemsListContextMenu anchorRef={containerRef} {...contextMenuItem} />}
        </>
    ) : (
        <div className="flex items-center justify-center color-weak text-sm text-center text-break h-full">
            <strong>{c('Title').t`No reused passwords`}</strong>
        </div>
    );
};
