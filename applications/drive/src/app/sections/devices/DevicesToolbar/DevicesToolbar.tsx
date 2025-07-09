import { useMemo } from 'react';

import { Toolbar } from '@proton/components';
import { splitNodeUid } from '@proton/drive';

import { useSelection } from '../../../components/FileBrowser';
import { LayoutButton } from '../../../components/sections/ToolbarButtons';
import DesktopDownloadDropdown from '../../../components/sections/ToolbarButtons/DesktopDownloadDropdown';
import { getSelectedDevice } from '../DevicesView/getSelectedDevice';
import { useDeviceStore } from '../devices.store';
import { DeviceRemoveButton } from './buttons/RemoveButton';
import { DeviceRenameButton } from './buttons/RenameButton';

export const DevicesToolbar = () => {
    const { deviceList } = useDeviceStore();
    const selectionControls = useSelection()!;

    // TODO: remove once useSelection is converted
    // File selection relies on ID
    const browserItems = useMemo(
        () =>
            deviceList.map((device) => ({
                ...device,
                id: splitNodeUid(device.uid).nodeId,
            })),
        [deviceList]
    );

    const selectedItems = useMemo(
        () => getSelectedDevice(browserItems, selectionControls!.selectedItemIds),
        [browserItems, selectionControls!.selectedItemIds]
    );

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return null;
        }

        return (
            <>
                <DeviceRenameButton selectedDevices={selectedItems} />
                <DeviceRemoveButton selectedDevices={selectedItems} />
            </>
        );
    };

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex">{renderSelectionActions()}</div>
            <span className="ml-auto flex flex-nowrap">
                <DesktopDownloadDropdown className="self-center mr-2" />
                <LayoutButton />
            </span>
        </Toolbar>
    );
};
