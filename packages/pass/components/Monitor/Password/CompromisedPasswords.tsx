import { type FC, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useContextMenu } from '@proton/pass/components/ContextMenu/ContextMenuProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import {
    ItemsListContextMenu,
    useItemContextMenu,
} from '@proton/pass/components/Item/ContextMenu/ItemsListContextMenu';
import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsListItem';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorContext';
import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import { useAutoSelect } from '@proton/pass/hooks/items/useAutoSelect';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { selectPassPlan, selectSelectedItems } from '@proton/pass/store/selectors';
import type { ItemRevision } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

export const CompromisedPasswords: FC = () => {
    const { onTelemetry } = usePassCore();
    const listRef = useRef<List>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectItem = useSelectItemAction();

    const paid = isPaidPlan(useSelector(selectPassPlan));
    const { compromised } = useMonitor();
    const items = useMemoSelector(selectSelectedItems, [paid ? compromised.data : [], 'titleASC']);
    const selectedItem = useSelectedItem();
    const { close } = useContextMenu();
    const { item: contextMenuItem, onContextMenu } = useItemContextMenu();

    useAutoSelect(items[0]);
    useTelemetryEvent(TelemetryEventName.PassMonitorDisplayCompromisedPasswords, {}, {})([]);

    const onSelect = useCallback((item: ItemRevision) => {
        onTelemetry(TelemetryEventName.PassMonitorItemDetailFromCompromisedPassword, {}, {});
        selectItem(item, { scope: 'monitor/compromised' });
    }, []);

    if (items.length === 0) {
        const emptyLabel = (() => {
            if (!paid) return c('Title').t`Upgrade to check for compromised passwords`;
            if (compromised.loading) return <CircleLoader size="small" />;
            return c('Title').t`No compromised passwords`;
        })();

        return (
            <div className="flex items-center justify-center color-weak text-sm text-center text-break h-full">
                <strong>{emptyLabel}</strong>
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
