import { type FC, useCallback, useRef } from 'react';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

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
import { usePassCore } from '../../Core/PassCoreProvider';
import { ItemsListContextMenu, useItemContextMenu } from '../../Item/ContextMenu/ItemsListContextMenu';
import { ItemsListItem } from '../../Item/List/ItemsListItem';
import { VirtualList } from '../../Layout/List/VirtualList';
import { useSelectedItem } from '../../Navigation/NavigationItem';
import { useMonitor } from '../MonitorContext';

export const WeakPasswords: FC = () => {
    const { onTelemetry } = usePassCore();
    const listRef = useRef<List>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectItem = useSelectItemAction();

    const { insecure } = useMonitor();
    const items = useMemoSelector(selectSelectedItems, [insecure.data, 'titleASC']);
    const selectedItem = useSelectedItem();
    const { close } = useContextMenu();
    const { item: contextMenuItem, onContextMenu } = useItemContextMenu();

    useAutoSelect(items[0]);
    useTelemetryEvent(TelemetryEventName.PassMonitorDisplayWeakPasswords, {}, {})([]);

    const onSelect = useCallback((item: ItemRevision) => {
        onTelemetry(TelemetryEventName.PassMonitorItemDetailFromWeakPassword, {}, {});
        selectItem(item, { scope: 'monitor/weak' });
    }, []);

    if (items.length === 0) {
        return (
            <div className="flex items-center justify-center color-weak text-sm text-center text-break h-full">
                <strong>
                    {insecure.loading ? <CircleLoader size="small" /> : c('Title').t`No insecure passwords`}
                </strong>
            </div>
        );
    }

    return (
        <>
            <VirtualList
                ref={listRef}
                containerRef={containerRef}
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
    );
};
