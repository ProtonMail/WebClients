import { type FC, useCallback, useRef } from 'react';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { useAutoSelect } from '../../../hooks/items/useAutoSelect';
import { useMemoSelector } from '../../../hooks/useMemoSelector';
import { useSelectItemAction } from '../../../hooks/useSelectItemAction';
import { useTelemetryEvent } from '../../../hooks/useTelemetryEvent';
import { itemEq } from '../../../lib/items/item.predicates';
import { getItemKey } from '../../../lib/items/item.utils';
import { selectSelectedItems } from '../../../store/selectors';
import type { ItemRevision } from '../../../types';
import { TelemetryEventName } from '../../../types/data/telemetry';
import { useContextMenu } from '../../ContextMenu/ContextMenuProvider';
import { ItemsListContextMenu, useItemContextMenu } from '../../Item/ContextMenu/ItemsListContextMenu';
import { ItemsListItem } from '../../Item/List/ItemsListItem';
import { VirtualList } from '../../Layout/List/VirtualList';
import { useSelectedItem } from '../../Navigation/NavigationItem';
import { useMonitor } from '../MonitorContext';

export const ExcludedItems: FC = () => {
    const listRef = useRef<List>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectItem = useSelectItemAction();

    const { excluded } = useMonitor();
    const items = useMemoSelector(selectSelectedItems, [excluded.data, 'titleASC']);
    const selectedItem = useSelectedItem();
    const { close } = useContextMenu();
    const { item: contextMenuItem, onContextMenu } = useItemContextMenu();

    useAutoSelect(items[0]);
    useTelemetryEvent(TelemetryEventName.PassMonitorDisplayExcludedItems, {}, {})([]);

    const onSelect = useCallback((item: ItemRevision) => {
        selectItem(item, { scope: 'monitor/excluded' });
    }, []);

    return items.length > 0 ? (
        <>
            <VirtualList
                ref={listRef}
                rowCount={items.length}
                rowHeight={() => 54}
                rowRenderer={({ style, index, key }) => {
                    const item = items[index];
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
                }}
                onScroll={close}
            />
            {contextMenuItem && <ItemsListContextMenu anchorRef={containerRef} {...contextMenuItem} />}
        </>
    ) : (
        <div className="flex items-center justify-center color-weak text-sm text-center text-break h-full">
            <strong>{c('Title').t`No excluded items`}</strong>
        </div>
    );
};
