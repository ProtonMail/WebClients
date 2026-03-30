import { useRef } from 'react';

import { c } from 'ttag';

import { ContactEmailsProvider, useActiveBreakpoint, useConfirmActionModal } from '@proton/components';

import { useItemContextMenu } from '../../components/FileBrowser';
import { DriveExplorer } from '../../statelessComponents/DriveExplorer/DriveExplorer';
import type {
    DriveExplorerConditions,
    DriveExplorerEvents,
    DriveExplorerSelection,
    DriveExplorerSort,
} from '../../statelessComponents/DriveExplorer/types';
import EmptySharedWithMe from './EmptySharedWithMe';
import { getSharedWithMeCells, getSharedWithMeGrid } from './SharedWithMeCells';
import { SharedWithMeContextMenu } from './SharedWithMeItemContextMenu';
import { useSharedWithMeItems } from './hooks/useSharedWithMeItems';
import { ItemType, useSharedWithMeStore } from './useSharedWithMe.store';

export const SharedWithMe = () => {
    const { viewportWidth } = useActiveBreakpoint();
    const contextMenuControls = useItemContextMenu();
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);
    const [confirmModal, showConfirmModal] = useConfirmActionModal();

    const {
        uids,
        selectedItems,
        isLoading,
        sortParams,
        handleOpenItem,
        handleSorting,
        isEmpty,
        handleRenderItem,
        layout,
        previewModal,
        selectionControls,
    } = useSharedWithMeItems();

    const events: DriveExplorerEvents = {
        onItemClick: () => {
            if (contextMenuControls.isOpen) {
                contextMenuControls.close();
            }
        },
        onItemDoubleClick: (uid) => {
            void handleOpenItem(uid);
        },
        onItemContextMenu: (uid, event) => {
            contextMenuControls.handleContextMenu(event);
        },
        onItemRender: (uid) => {
            handleRenderItem({ id: uid });
        },
    };

    const sort: DriveExplorerSort = {
        sortBy: sortParams.sortField,
        sortDirection: sortParams.sortOrder,
        onSort: handleSorting,
    };

    if (isEmpty) {
        return <EmptySharedWithMe />;
    }

    const selection: DriveExplorerSelection = {
        selectedItems: new Set(selectionControls.selectedItemIds),
        selectionMethods: selectionControls,
    };

    const cells = getSharedWithMeCells({
        viewportWidth,
        showConfirmModal,
        onRenderItem: (uid) => {
            handleRenderItem({ id: uid });
        },
    });

    const grid = getSharedWithMeGrid({
        contextMenuControls,
        selectionControls,
    });

    const conditions: DriveExplorerConditions = {
        isDraggable: (uid) => {
            const item = useSharedWithMeStore.getState().sharedWithMeItems.get(uid);
            if (item && item.itemType === ItemType.INVITATION) {
                return false;
            }
            return true;
        },
        isDoubleClickable: (uid) => {
            const item = useSharedWithMeStore.getState().sharedWithMeItems.get(uid);
            if (item && item.itemType === ItemType.INVITATION) {
                return false;
            }
            return true;
        },
    };

    return (
        <ContactEmailsProvider>
            <SharedWithMeContextMenu
                selectedBrowserItems={selectedItems}
                anchorRef={contextMenuAnchorRef}
                close={contextMenuControls.close}
                isOpen={contextMenuControls.isOpen}
                open={contextMenuControls.open}
                position={contextMenuControls.position}
            />
            <div ref={contextMenuAnchorRef} className="flex flex-1">
                <DriveExplorer
                    itemIds={uids}
                    layout={layout}
                    cells={cells}
                    grid={grid}
                    selection={selection}
                    events={events}
                    conditions={conditions}
                    sort={sort}
                    loading={isLoading}
                    caption={c('Title').t`Shared with me`}
                    contextMenuControls={{
                        isOpen: contextMenuControls.isOpen,
                        showContextMenu: contextMenuControls.handleContextMenu,
                        close: contextMenuControls.close,
                    }}
                />
            </div>
            {confirmModal}
            {previewModal}
        </ContactEmailsProvider>
    );
};
