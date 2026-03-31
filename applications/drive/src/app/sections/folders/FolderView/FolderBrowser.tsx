import { type ReactNode, useCallback, useEffect, useRef } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { useActiveBreakpoint } from '@proton/components';
import { generateNodeUid, getDrive, splitNodeUid } from '@proton/drive';
import { loadThumbnail } from '@proton/drive/modules/thumbnails';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';
import type { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import ToolbarRow from '../../../components/sections/ToolbarRow/ToolbarRow';
import type { DriveFolder } from '../../../hooks/drive/useActiveShare';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useContextMenuStore } from '../../../modules/contextMenu';
import { useSelectionStore } from '../../../modules/selection';
import type { SortConfig, SortField } from '../../../modules/sorting';
import { DriveExplorer } from '../../../statelessComponents/DriveExplorer/DriveExplorer';
import type {
    DriveExplorerEvents,
    DriveExplorerSelection,
    DriveExplorerSort,
} from '../../../statelessComponents/DriveExplorer/types';
import { getOpenInDocsInfo, openDocsOrSheetsDocument } from '../../../utils/docs/openInDocs';
import { EmptyDeviceRoot } from '../EmptyFolder/EmptyDeviceRoot';
import { EmptyFolder } from '../EmptyFolder/EmptyFolder';
import { getFolderCells, getFolderGrid } from '../FolderDriveExplorerCells';
import { getSelectedItems } from '../getSelectedItems';
import { FolderContextMenu } from '../menus/FolderContextMenu';
import { FolderItemContextMenu } from '../menus/FolderItemContextMenu';
import { FolderToolbar } from '../menus/FolderToolbar';
import type { FolderViewItem } from '../useFolder.store';
import { useFolderStore } from '../useFolder.store';
import { useFolderActions } from '../useFolderActions';

interface Props {
    activeFolder: DriveFolder;
    layout: LayoutSetting;
    sortedList: FolderViewItem[];
    breadcrumbs?: ReactNode;
    showToolbarOptionsForNoSelection?: boolean;
    onSortChange: (sortField: SortField, direction: SORT_DIRECTION) => Promise<void>;
}

export function FolderBrowser({
    activeFolder,
    layout,
    sortedList,
    breadcrumbs,
    showToolbarOptionsForNoSelection,
    onSortChange,
}: Props) {
    const { shareId, linkId, volumeId } = activeFolder;
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);
    const contextMenu = useContextMenuStore();
    const { viewportWidth } = useActiveBreakpoint();

    const { navigateToLink } = useDriveNavigation();

    const { permissions, isLoading, folder, hasEverLoaded, sortField, sortDirection } = useFolderStore(
        useShallow((state) => ({
            isLoading: state.isLoading,
            permissions: state.permissions,
            folder: state.folder,
            hasEverLoaded: state.hasEverLoaded,
            sortField: state.sortField,
            sortDirection: state.sortDirection,
        }))
    );

    const sortedItemUids = sortedList.map((item) => item.uid);

    const selectedItemIds = useSelectionStore(useShallow((state) => state.selectedItemIds));
    const selectedItems = getSelectedItems(sortedList, Array.from(selectedItemIds));

    const allSortedItems = sortedList.map((item) => ({
        nodeUid: item.uid,
        mimeType: item.mimeType,
        storageSize: item.size,
    }));

    const { actions, uploadFile, uploadFolder, modals } = useFolderActions({
        allSortedItems,
        selectedItems,
        shareId,
        linkId,
        volumeId,
    });

    useEffect(() => {
        useSelectionStore.getState().setAllItemIds(new Set(sortedItemUids));
    }, [sortedItemUids]);

    // Close context menu when navigating to a different folder
    useEffect(() => {
        contextMenu.close();
    }, [shareId, linkId]);

    const handleClick = useCallback(
        (uid: string) => {
            const item = useFolderStore.getState().items.get(uid);
            if (!item) {
                return;
            }
            const { nodeId } = splitNodeUid(uid);
            document.getSelection()?.removeAllRanges();

            const openInDocsInfo = getOpenInDocsInfo(item.mimeType);
            if (openInDocsInfo && openInDocsInfo.isNative) {
                return openDocsOrSheetsDocument({
                    type: openInDocsInfo.type,
                    isNative: openInDocsInfo.isNative,
                    uid: generateNodeUid(item.volumeId, item.linkId),
                    openBehavior: 'tab',
                });
            }

            if (item.isFile) {
                actions.showPreviewForNode(item.uid);
            } else {
                navigateToLink(shareId, nodeId, item.isFile);
            }
        },
        [navigateToLink, actions, shareId]
    );

    const handleDriveExplorerSorting = useCallback(
        ({
            sortField,
            direction,
            sortConfig,
        }: {
            sortField: SortField;
            direction: SORT_DIRECTION;
            sortConfig: SortConfig;
        }) => {
            useFolderStore.getState().setSorting({ sortField, direction, sortConfig });
            void onSortChange(sortField, direction);
        },
        [onSortChange]
    );

    const toolbar = (
        <FolderToolbar
            volumeId={volumeId}
            actions={actions}
            uploadFile={uploadFile}
            uploadFolder={uploadFolder}
            showOptionsForNoSelection={showToolbarOptionsForNoSelection}
        />
    );

    const handleItemRender = useCallback(async (item: FolderViewItem) => {
        if (item.activeRevisionUid) {
            loadThumbnail(getDrive(), {
                nodeUid: item.uid,
                revisionUid: item.activeRevisionUid,
            });
        }
    }, []);

    const isEmpty = hasEverLoaded && !isLoading && !sortedList.length;

    if (isEmpty) {
        if (!permissions.canEdit) {
            return (
                <>
                    <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />
                    <EmptyDeviceRoot />
                </>
            );
        }
        return (
            <>
                <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />
                <EmptyFolder actions={actions} uploadFile={uploadFile} uploadFolder={uploadFolder} />
                <input
                    multiple
                    type="file"
                    ref={uploadFile.fileInputRef}
                    className="hidden"
                    onChange={uploadFile.handleFileChange}
                />
                <input
                    type="file"
                    ref={uploadFolder.folderInputRef}
                    className="hidden"
                    onChange={uploadFolder.handleFolderChange}
                />
                {modals.createFolderModal}
                {modals.createFileModal}
                {modals.sharingModal}
                {modals.fileSharingModal}
            </>
        );
    }

    const cells = getFolderCells({ viewportWidth });
    const grid = getFolderGrid();

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
            contextMenu.handleContextMenu(event, 'item');
        },
        onItemRender: (uid) => {
            const item = useFolderStore.getState().items.get(uid);
            if (item) {
                void handleItemRender(item);
            }
        },
        onViewContextMenu: (event) => {
            contextMenu.handleContextMenu(event, 'view');
        },
    };

    const sort: DriveExplorerSort = {
        sortBy: sortField,
        sortDirection,
        onSort: handleDriveExplorerSorting,
    };

    return (
        <>
            <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />
            <FolderContextMenu
                anchorRef={contextMenuAnchorRef}
                close={contextMenu.close}
                isOpen={contextMenu.isOpen && contextMenu.type === 'view'}
                open={contextMenu.open}
                position={contextMenu.position}
                actions={actions}
                uploadFile={uploadFile}
                uploadFolder={uploadFolder}
            />
            <FolderItemContextMenu
                volumeId={volumeId}
                shareId={shareId}
                linkId={linkId}
                selectedItems={selectedItems}
                anchorRef={contextMenuAnchorRef}
                close={contextMenu.close}
                isOpen={contextMenu.isOpen && contextMenu.type === 'item'}
                open={contextMenu.open}
                position={contextMenu.position}
                actions={actions}
            />
            <DriveExplorer
                itemIds={sortedItemUids}
                layout={layout}
                cells={cells}
                grid={grid}
                selection={selection}
                events={events}
                sort={sort}
                loading={isLoading}
                caption={folder?.name}
                contextMenuControls={{
                    isOpen: contextMenu.isOpen,
                    showContextMenu: contextMenu.handleContextMenu,
                    close: contextMenu.close,
                }}
            />
            <input
                multiple
                type="file"
                ref={uploadFile.fileInputRef}
                className="hidden"
                onChange={uploadFile.handleFileChange}
            />
            <input
                type="file"
                ref={uploadFolder.folderInputRef}
                className="hidden"
                onChange={uploadFolder.handleFolderChange}
            />
            {modals.previewModal}
            {modals.renameModal}
            {modals.moveItemsModal}
            {modals.copyModal}
            {modals.createFileModal}
            {modals.createFolderModal}
            {modals.detailsModal}
            {modals.filesDetailsModal}
            {modals.revisionsModal}
            {modals.sharingModal}
            {modals.fileSharingModal}
        </>
    );
}
