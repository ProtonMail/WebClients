import { useCallback, useMemo, useRef } from 'react';

import { useActiveBreakpoint } from '@proton/components';
import { splitNodeUid } from '@proton/drive/index';

import type { BrowserItemId, ListViewHeaderItem } from '../../../components/FileBrowser';
import FileBrowser, {
    Cells,
    type FileBrowserBaseItem,
    useItemContextMenu,
    useSelection,
} from '../../../components/FileBrowser';
import EmptyDevices from '../../../components/sections/Devices/EmptyDevices';
import { getDevicesSectionName } from '../../../components/sections/Devices/constants';
import { GridViewItemDevice } from '../../../components/sections/FileBrowser/GridViewItemDevice';
import { DeviceNameCell } from '../../../components/sections/FileBrowser/contentCells';
import headerCellsCommon from '../../../components/sections/FileBrowser/headerCells';
import headerCells from '../../../components/sections/FileBrowser/headerCells';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../../hooks/drive/useOnItemRenderedMetrics';
import { useUserSettings } from '../../../store';
import { DevicesItemContextMenu } from '../DevicesItemContextMenu/DevicesContextMenu';
import { useDeviceStore } from '../devices.store';
import { getSelectedDevice } from './getSelectedDevice';

export interface DeviceItem extends FileBrowserBaseItem {
    modificationTime: number;
    name: string;
}

const { ContextMenuCell } = Cells;

const largeScreenCells: React.FC<{ item: DeviceItem }>[] = [DeviceNameCell, ContextMenuCell];
const smallScreenCells = [DeviceNameCell, ContextMenuCell];

const headerItemsLargeScreen: ListViewHeaderItem[] = [headerCells.name, headerCellsCommon.placeholder];

const headerItemsSmallScreen: ListViewHeaderItem[] = [headerCells.name, headerCellsCommon.placeholder];

export function DevicesBrowser() {
    const { deviceList, isLoading } = useDeviceStore();
    const { layout } = useUserSettings();
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);
    const { navigateToLink } = useDriveNavigation();
    const browserItemContextMenu = useItemContextMenu();
    const selectionControls = useSelection();
    const { viewportWidth } = useActiveBreakpoint();
    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(layout, isLoading);
    const sectionTitle = getDevicesSectionName();

    // TODO: remove once FileBrowser is converted
    // Conversion from SDK Device to a type compatible with the file browser
    const browserItems = useMemo(
        () =>
            deviceList.map((device) => ({
                ...device,
                modificationTime: device.creationTime.getTime(),
                id: splitNodeUid(device.uid).nodeId,
                linkId: splitNodeUid(device.rootFolderUid).nodeId,
                volumeId: splitNodeUid(device.rootFolderUid).volumeId,
                haveLegacyName: false,
            })),
        [deviceList]
    );

    const selectedItemsUid = useMemo(
        () => getSelectedDevice(browserItems, selectionControls!.selectedItemIds).map((dev) => dev.uid),
        [browserItems, selectionControls!.selectedItemIds]
    );

    const handleItemRender = useCallback(() => {
        incrementItemRenderedCounter();
    }, [incrementItemRenderedCounter]);

    const handleClick = useCallback(
        (id: BrowserItemId) => {
            const item = browserItems.find((item) => item.id === id);

            if (!item) {
                return;
            }
            document.getSelection()?.removeAllRanges();
            navigateToLink(item.shareId, item.linkId, false);
        },
        [navigateToLink, browserItems]
    );

    /* eslint-disable react/display-name */
    const GridHeaderComponent = useMemo(
        () => () => {
            return null;
        },
        [isLoading]
    );

    if (!browserItems.length && !isLoading) {
        return <EmptyDevices />;
    }

    const Cells = viewportWidth['>=large'] ? largeScreenCells : smallScreenCells;
    const headerItems = viewportWidth['>=large'] ? headerItemsLargeScreen : headerItemsSmallScreen;

    return (
        <>
            <DevicesItemContextMenu
                selectedDevicesUid={selectedItemsUid}
                anchorRef={contextMenuAnchorRef}
                close={browserItemContextMenu.close}
                isOpen={browserItemContextMenu.isOpen}
                open={browserItemContextMenu.open}
                position={browserItemContextMenu.position}
            />
            <FileBrowser
                isMultiSelectionDisabled={true}
                caption={sectionTitle}
                items={browserItems}
                headerItems={headerItems}
                onItemRender={handleItemRender}
                layout={layout}
                loading={isLoading}
                Cells={Cells}
                GridHeaderComponent={GridHeaderComponent}
                GridViewItem={GridViewItemDevice}
                onItemOpen={handleClick}
                contextMenuAnchorRef={contextMenuAnchorRef}
                onItemContextMenu={browserItemContextMenu.handleContextMenu}
            />
        </>
    );
}
