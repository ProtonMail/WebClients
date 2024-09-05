import { type FC, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsListItem';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorContext';
import { getItemRoute } from '@proton/pass/components/Navigation/routing';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { isTrashed, itemEq } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { selectOptimisticItemsFactory, selectSelectedItems } from '@proton/pass/store/selectors';
import type { SelectedItem } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

export const Missing2FAs: FC = () => {
    const { onTelemetry } = usePassCore();
    const listRef = useRef<List>(null);
    const selectItem = useSelectItemAction();

    const { missing2FAs } = useMonitor();
    const items = useSelector(selectOptimisticItemsFactory(selectSelectedItems(missing2FAs.data)));
    const itemRoute = getItemRoute(':shareId', ':itemId', { prefix: 'monitor/2fa(/trash)?' });
    const selectedItem = useRouteMatch<SelectedItem>(itemRoute)?.params;

    useEffect(() => {
        if (items.length > 0 && !selectedItem) {
            const item = items[0];
            selectItem(item, { inTrash: isTrashed(item), prefix: 'monitor/2fa', mode: 'replace' });
        }
    }, [selectedItem, items]);

    useTelemetryEvent(TelemetryEventName.PassMonitorDisplayMissing2FA, {}, {})([]);

    return items.length > 0 ? (
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
                            failed={item.failed}
                            id={id}
                            item={item}
                            key={id}
                            optimistic={item.optimistic}
                            onClick={(e) => {
                                e.preventDefault();
                                onTelemetry(TelemetryEventName.PassMonitorItemDetailFromMissing2FA, {}, {});
                                selectItem(item, {
                                    inTrash: isTrashed(item),
                                    prefix: 'monitor/2fa',
                                });
                            }}
                        />
                    </div>
                );
            }}
        />
    ) : (
        <div className="flex items-center justify-center color-weak text-sm text-center text-break h-full">
            <strong>{c('Title').t`No inactive 2FAs`}</strong>
        </div>
    );
};
