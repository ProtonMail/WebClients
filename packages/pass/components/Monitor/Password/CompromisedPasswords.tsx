import { type FC, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { IcPassShieldMonitoringOk } from '@proton/icons/icons/IcPassShieldMonitoringOk';

import { useAutoSelect } from '../../../hooks/items/useAutoSelect';
import { useFeatureFlag, useFeatureFlagsReady } from '../../../hooks/useFeatureFlag';
import { useMemoSelector } from '../../../hooks/useMemoSelector';
import { useSelectItemAction } from '../../../hooks/useSelectItemAction';
import { useTelemetryEvent } from '../../../hooks/useTelemetryEvent';
import { itemEq } from '../../../lib/items/item.predicates';
import { getItemKey } from '../../../lib/items/item.utils';
import { isPaidPlan } from '../../../lib/user/user.predicates';
import { selectPassPlan, selectSelectedItems } from '../../../store/selectors';
import type { ItemRevision } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { TelemetryEventName } from '../../../types/data/telemetry';
import { useContextMenu } from '../../ContextMenu/ContextMenuProvider';
import { usePassCore } from '../../Core/PassCoreProvider';
import { ItemsListContextMenu, useItemContextMenu } from '../../Item/ContextMenu/ItemsListContextMenu';
import { ItemsListItem } from '../../Item/List/ItemsListItem';
import { VirtualList } from '../../Layout/List/VirtualList';
import { useSelectedItem } from '../../Navigation/NavigationItem';
import { getLocalPath } from '../../Navigation/routing';
import { useMonitor } from '../MonitorContext';

export const CompromisedPasswords: FC = () => {
    const { onTelemetry } = usePassCore();
    const listRef = useRef<List>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectItem = useSelectItemAction();

    const featureFlagsReady = useFeatureFlagsReady();
    const enabled = useFeatureFlag(PassFeature.Pass__V1_40__CompromisedPasswords);
    const paid = isPaidPlan(useSelector(selectPassPlan));
    const { compromised } = useMonitor();
    const items = useMemoSelector(selectSelectedItems, [paid ? compromised.data : [], 'titleASC']);
    const selectedItem = useSelectedItem();
    const { close } = useContextMenu();
    const { item: contextMenuItem, onContextMenu } = useItemContextMenu();

    useAutoSelect(items[0]);
    useTelemetryEvent(TelemetryEventName.PassMonitorDisplayCompromisedPasswords, {}, {})([enabled]);

    const onSelect = useCallback((item: ItemRevision) => {
        onTelemetry(TelemetryEventName.PassMonitorItemDetailFromCompromisedPassword, {}, {});
        selectItem(item, { scope: 'monitor/compromised' });
    }, []);

    if (!featureFlagsReady) return null;
    if (!enabled) return <Redirect to={getLocalPath('monitor')} push={false} />;

    if (items.length === 0) {
        if (!paid) {
            return (
                <div className="flex items-center justify-center color-weak text-sm text-center text-break h-full">
                    <strong>{c('Title').t`Upgrade to check for compromised passwords`}</strong>
                </div>
            );
        }

        if (compromised.loading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <CircleLoader size="small" />
                </div>
            );
        }

        return (
            <div className="flex flex-column items-center justify-center gap-2 text-center text-break h-full px-4">
                <IcPassShieldMonitoringOk size={12} className="color-success" />
                <strong className="text-rg">{c('Title').t`No compromised passwords`}</strong>
                <span className="color-weak text-sm">
                    {c('Info').t`None of your saved passwords have appeared in a known data breach.`}
                </span>
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
