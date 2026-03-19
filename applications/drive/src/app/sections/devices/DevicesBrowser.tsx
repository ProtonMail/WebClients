import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { splitNodeUid } from '@proton/drive/index';

import EmptyDevices from '../../components/sections/Devices/EmptyDevices';
import useDriveNavigation from '../../hooks/drive/useNavigate';
import { useContextMenuStore } from '../../modules/contextMenu';
import { useSelectionStore } from '../../modules/selection';
import { DriveExplorer } from '../../statelessComponents/DriveExplorer/DriveExplorer';
import type { DriveExplorerEvents, DriveExplorerSelection } from '../../statelessComponents/DriveExplorer/types';
import { useUserSettings } from '../../store';
import { getDevicesCells, getDevicesGrid } from './DevicesDriveExplorerCells';
import { DevicesItemContextMenu } from './connectedComponents/DevicesItemContextMenu';
import { useDevicesStore } from './useDevices.store';

interface Props {
    onRename: (deviceUid: string) => void;
    onRemove: (deviceUid: string) => void;
}

export function DevicesBrowser({ onRename, onRemove }: Props) {
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);
    const contextMenu = useContextMenuStore();

    const { hasEverLoaded, isLoading, sortedItemUids } = useDevicesStore(
        useShallow((state) => ({
            hasEverLoaded: state.hasEverLoaded,
            isLoading: state.isLoading,
            sortedItemUids: state.sortedItemUids,
        }))
    );
    const { layout } = useUserSettings();
    const selectedItemIds = useSelectionStore(useShallow((state) => state.selectedItemIds));
    const selectedItemsUid = Array.from(selectedItemIds);
    const { navigateToLink } = useDriveNavigation();

    useEffect(() => {
        useSelectionStore.getState().setAllItemIds(sortedItemUids);
    }, [sortedItemUids]);

    const handleClick = useCallback(
        (uid: string) => {
            const device = useDevicesStore.getState().getItem(uid);
            if (!device) {
                return;
            }
            document.getSelection()?.removeAllRanges();
            const { nodeId } = splitNodeUid(device.rootFolderUid);
            navigateToLink(device.shareId, nodeId, false);
        },
        [navigateToLink]
    );

    const isEmpty = hasEverLoaded && !isLoading && sortedItemUids.size === 0;

    if (isEmpty) {
        return <EmptyDevices />;
    }

    const cells = getDevicesCells();
    const grid = getDevicesGrid();

    const selectionStore = useSelectionStore.getState();
    const selection: DriveExplorerSelection = {
        selectedItems: selectedItemIds,
        selectionMethods: {
            selectionState: selectionStore.getSelectionState(),
            selectItem: selectionStore.selectItem,
            toggleSelectItem: selectionStore.toggleSelectItem,
            toggleRange: selectionStore.toggleRange,
            toggleAllSelected: selectionStore.toggleAllSelected,
            clearSelections: selectionStore.clearSelections,
            isSelected: selectionStore.isSelected,
        },
    };

    const events: DriveExplorerEvents = {
        onItemClick: () => {
            if (contextMenu.isOpen) {
                contextMenu.close();
            }
        },
        onItemDoubleClick: (uid) => {
            void handleClick(uid);
        },
        onItemContextMenu: (_uid, event) => {
            contextMenu.handleContextMenu(event);
        },
        onItemRender: () => {},
    };

    return (
        <>
            <DevicesItemContextMenu
                selectedDevicesUid={selectedItemsUid}
                anchorRef={contextMenuAnchorRef}
                close={contextMenu.close}
                isOpen={contextMenu.isOpen}
                open={contextMenu.open}
                position={contextMenu.position}
                onRename={onRename}
                onRemove={onRemove}
            />
            <DriveExplorer
                itemIds={Array.from(sortedItemUids)}
                layout={layout}
                cells={cells}
                grid={grid}
                selection={selection}
                events={events}
                loading={isLoading}
                caption={c('Title').t`Devices`}
                isMultiSelectionDisabled={true}
                contextMenuControls={{
                    isOpen: contextMenu.isOpen,
                    showContextMenu: contextMenu.handleContextMenu,
                    close: contextMenu.close,
                }}
            />
        </>
    );
}
