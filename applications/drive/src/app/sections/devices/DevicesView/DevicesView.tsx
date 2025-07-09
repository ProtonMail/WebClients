import { useMemo } from 'react';

import { useAppTitle } from '@proton/components';
import { splitNodeUid } from '@proton/drive/index';

import { FileBrowserStateProvider } from '../../../components/FileBrowser';
import { getDevicesSectionName } from '../../../components/sections/Devices/constants';
import ToolbarRow from '../../../components/sections/ToolbarRow/ToolbarRow';
import { DevicesToolbar } from '../DevicesToolbar/DevicesToolbar';
import { useDeviceStore } from '../devices.store';
import { DevicesBrowser } from './DevicesBrowser';

export function DevicesView() {
    const sectionTitle = getDevicesSectionName();
    useAppTitle(sectionTitle);
    const { deviceList } = useDeviceStore();

    // Uses the legacy Device-Id because that's how the global file selection works right now
    const itemIds = useMemo(() => deviceList.map((device) => splitNodeUid(device.uid).nodeId), [deviceList]);

    return (
        <FileBrowserStateProvider itemIds={itemIds}>
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{sectionTitle}</span>}
                toolbar={<DevicesToolbar />}
            />
            <DevicesBrowser />
        </FileBrowserStateProvider>
    );
}
