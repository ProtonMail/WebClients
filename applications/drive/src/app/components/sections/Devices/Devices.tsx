import { useCallback, useMemo, useRef } from 'react';

import { useActiveBreakpoint } from '@proton/components';

import useNavigate from '../../../hooks/drive/useNavigate';
import type { useDevicesView } from '../../../store';
import FileBrowser, { Cells, useItemContextMenu, useSelection } from '../../FileBrowser';
import type { BrowserItemId, FileBrowserBaseItem, ListViewHeaderItem } from '../../FileBrowser/interface';
import { GridViewItemDevice } from '../FileBrowser/GridViewItemDevice';
import { DeviceNameCell } from '../FileBrowser/contentCells';
import headerCellsCommon from '../FileBrowser/headerCells';
import { DevicesItemContextMenu } from './ContextMenu/DevicesContextMenu';
import EmptyDevices from './EmptyDevices';
import { getSelectedItems } from './Toolbar/DevicesToolbar';
import { getDevicesSectionName } from './constants';
import headerCells from './headerCells';

export interface DeviceItem extends FileBrowserBaseItem {
    modificationTime: number;
    name: string;
}
interface Props {
    view: ReturnType<typeof useDevicesView>;
}

const { ContextMenuCell } = Cells;

const largeScreenCells: React.FC<{ item: DeviceItem }>[] = [DeviceNameCell, ContextMenuCell];
const smallScreenCells = [DeviceNameCell, ContextMenuCell];

const headerItemsLargeScreen: ListViewHeaderItem[] = [headerCells.name, headerCellsCommon.placeholder];

const headerItemsSmallScreen: ListViewHeaderItem[] = [headerCells.name, headerCellsCommon.placeholder];

function Devices({ view }: Props) {
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const { navigateToLink } = useNavigate();
    const browserItemContextMenu = useItemContextMenu();
    const selectionControls = useSelection();
    const { viewportWidth } = useActiveBreakpoint();

    const { layout, items: browserItems, isLoading } = view;
    const sectionTitle = getDevicesSectionName();

    const selectedItems = useMemo(
        () => getSelectedItems(browserItems, selectionControls!.selectedItemIds),
        [browserItems, selectionControls!.selectedItemIds]
    );

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
                selectedDevices={selectedItems}
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

export default Devices;
