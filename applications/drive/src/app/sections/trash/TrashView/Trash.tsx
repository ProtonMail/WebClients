import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useActiveBreakpoint } from '@proton/components';
import { NodeType, getDrivePerNodeType } from '@proton/drive';
import { loadThumbnail } from '@proton/drive/modules/thumbnails';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { isNativeProtonDocsAppFile } from '@proton/shared/lib/helpers/mimetype';

import { useContextMenuStore } from '../../../modules/contextMenu';
import { useSelectionStore } from '../../../modules/selection';
import type { SortConfig, SortField } from '../../../modules/sorting';
import { DriveExplorer } from '../../../statelessComponents/DriveExplorer/DriveExplorer';
import type {
    DriveExplorerEvents,
    DriveExplorerSelection,
    DriveExplorerSort,
} from '../../../statelessComponents/DriveExplorer/types';
import { useUserSettings } from '../../../store';
import { getTrashCells, getTrashGrid } from '../TrashDriveExplorerCells';
import { TrashItemContextMenu } from '../menus/TrashItemContextMenu';
import { EmptyTrash } from '../statelessComponents/EmptyTrash';
import type { TrashItem } from '../useTrash.store';
import { useTrashStore } from '../useTrash.store';

interface Props {
    onPreview: (props: { deprecatedContextShareId: string; nodeUid: string; canOpenInDocs: boolean }) => void;
    handleShowDetails: (props: { nodeUid: string }) => void;
    handleShowFilesDetails: (props: { nodeUids: string[] }) => void;
    onRestore: (items: TrashItem[]) => void;
    onDelete: (items: TrashItem[]) => void;
}

export function Trash({ onPreview, handleShowDetails, handleShowFilesDetails, onRestore, onDelete }: Props) {
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);
    const contextMenu = useContextMenuStore();
    const { viewportWidth } = useActiveBreakpoint();

    const { hasEverLoaded, isLoading, sortedItemUids, sortField, direction } = useTrashStore(
        useShallow((state) => ({
            hasEverLoaded: state.hasEverLoaded,
            isLoading: state.isLoading,
            sortedItemUids: state.sortedItemUids,
            sortField: state.sortField,
            direction: state.direction,
        }))
    );
    const { layout } = useUserSettings();

    const selectedItemIds = useSelectionStore(useShallow((state) => state.selectedItemIds));
    const selectedItems = Array.from(selectedItemIds)
        .map((id) => useTrashStore.getState().getItem(id))
        .filter((item) => item !== undefined);

    useEffect(() => {
        useSelectionStore.getState().setAllItemIds(sortedItemUids);
    }, [sortedItemUids]);

    const handleRenderItem = useCallback((uid: string) => {
        const item = useTrashStore.getState().getItem(uid);
        if (!item) {
            return;
        }

        if (item.activeRevisionUid) {
            loadThumbnail(getDrivePerNodeType(item.type), {
                nodeUid: item.uid,
                revisionUid: item.activeRevisionUid,
            });
        }
    }, []);

    const handleDriveExplorerSorting = useCallback(
        ({
            sortField: newSortField,
            direction: newDirection,
            sortConfig,
        }: {
            sortField: SortField;
            direction: SORT_DIRECTION;
            sortConfig: SortConfig;
        }) => {
            useTrashStore.getState().setSorting({ sortField: newSortField, direction: newDirection, sortConfig });
        },
        []
    );

    const handleClick = (uid: string) => {
        const item = useTrashStore.getState().getItem(uid);

        if (!item) {
            return;
        }
        document.getSelection()?.removeAllRanges();

        if (item.mediaType && isNativeProtonDocsAppFile(item.mediaType)) {
            return;
        }

        if (item.type !== NodeType.File && item.type !== NodeType.Photo) {
            return;
        }

        onPreview({ deprecatedContextShareId: '', nodeUid: item.uid, canOpenInDocs: false });
    };

    const isEmpty = hasEverLoaded && !isLoading && sortedItemUids.size === 0;

    if (isEmpty) {
        return <EmptyTrash />;
    }

    const cells = getTrashCells({ viewportWidth });
    const grid = getTrashGrid();

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
        onItemRender: (uid) => {
            handleRenderItem(uid);
        },
    };

    const sort: DriveExplorerSort = {
        sortBy: sortField,
        sortDirection: direction,
        onSort: handleDriveExplorerSorting,
    };

    return (
        <>
            <TrashItemContextMenu
                selectedItems={selectedItems}
                anchorRef={contextMenuAnchorRef}
                close={contextMenu.close}
                isOpen={contextMenu.isOpen}
                open={contextMenu.open}
                position={contextMenu.position}
                onRestore={onRestore}
                onDelete={onDelete}
                onPreview={onPreview}
                showDetailsModal={handleShowDetails}
                showFilesDetailsModal={handleShowFilesDetails}
            />
            <DriveExplorer
                itemIds={Array.from(sortedItemUids)}
                layout={layout}
                cells={cells}
                grid={grid}
                selection={selection}
                events={events}
                sort={sort}
                loading={isLoading}
                caption={c('Title').t`Trash`}
                contextMenuControls={{
                    isOpen: contextMenu.isOpen,
                    showContextMenu: contextMenu.handleContextMenu,
                    close: contextMenu.close,
                }}
            />
        </>
    );
}
