import { useEffect } from 'react';

import { useAppTitle } from '@proton/components';

import { getDevicesSectionName } from '../../components/sections/Devices/constants';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import { DevicesBrowser } from './DevicesBrowser';
import { useDevicesActions } from './actions/useDevicesActions';
import { DevicesToolbar } from './connectedComponents/DevicesToolbar';
import { subscribeToDevicesEvents } from './subscribeToDevicesEvents';
import { useLoadDevices } from './useLoadDevices';

export function DevicesView() {
    const sectionTitle = getDevicesSectionName();
    useAppTitle(sectionTitle);
    const { modals, handleRename, handleRemove } = useDevicesActions();
    const { loadDevices } = useLoadDevices();

    useEffect(() => {
        const ac = new AbortController();
        void loadDevices(ac);
        return () => {
            ac.abort();
        };
    }, [loadDevices]);

    useEffect(() => {
        const unsubscribe = subscribeToDevicesEvents();

        return () => {
            unsubscribe();
        };
    });

    return (
        <>
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{sectionTitle}</span>}
                toolbar={<DevicesToolbar onRename={handleRename} onRemove={handleRemove} />}
            />
            <DevicesBrowser onRename={handleRename} onRemove={handleRemove} />
            {modals.renameDeviceModal}
            {modals.removeDeviceModal}
        </>
    );
}
