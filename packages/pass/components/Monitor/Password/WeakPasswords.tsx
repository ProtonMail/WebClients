import { type FC, useCallback, useEffect, useRef } from 'react';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsListItem';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorContext';
import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { selectSelectedItems } from '@proton/pass/store/selectors';
import type { ItemRevision } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

export const WeakPasswords: FC = () => {
    const { onTelemetry } = usePassCore();
    const listRef = useRef<List>(null);
    const selectItem = useSelectItemAction();

    const { insecure } = useMonitor();
    const items = useMemoSelector(selectSelectedItems, [insecure.data]);
    const selectedItem = useSelectedItem();

    useEffect(() => {
        if (items.length > 0 && !selectedItem) {
            const item = items[0];
            selectItem(item, { scope: 'monitor/weak', mode: 'replace' });
        }
    }, [selectedItem, items]);

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
                        />
                    </div>
                );
            }}
        />
    );
};
