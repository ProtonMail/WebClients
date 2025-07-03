import { useMemo } from 'react';

import { useAppTitle } from '@proton/components';
import { useDrive } from '@proton/drive/index';

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
    const { internal } = useDrive();

    // Uses the legacy Device-Id because that's how the global file selection works right now
    const itemIds = useMemo(
        () => deviceList.map((device) => internal.splitNodeUid(device.uid).nodeId),
        [deviceList, internal]
    );

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
