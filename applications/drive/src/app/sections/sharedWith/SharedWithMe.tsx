import { useRef } from 'react';

import { c } from 'ttag';

import { ContactEmailsProvider, Loader, useActiveBreakpoint, useConfirmActionModal } from '@proton/components';
import useFlag from '@proton/unleash/useFlag';

import { useItemContextMenu, useSelection } from '../../components/FileBrowser';
import { DriveExplorer } from '../../statelessComponents/DriveExplorer/DriveExplorer';
import type {
    DriveExplorerConditions,
    DriveExplorerEvents,
    DriveExplorerSelection,
    DriveExplorerSort,
} from '../../statelessComponents/DriveExplorer/types';
import { ItemType, getKeyUid, useSharedWithMeListingStore } from '../../zustand/sections/sharedWithMeListing.store';
import EmptySharedWithMe from './EmptySharedWithMe';
import { getSharedWithMeCells, getSharedWithMeContextMenu, getSharedWithMeGrid } from './SharedWithMeCells';
import { SharedWithMeContextMenu } from './SharedWithMeItemContextMenu';
import SharedWithMeOld from './SharedWithMeOld';
import { useSharedWithMeItemsWithSelection } from './hooks/useSharedWithMeItemsWithSelection';

const SharedWithMe = () => {
    const { viewportWidth } = useActiveBreakpoint();
    const contextMenuControls = useItemContextMenu();
    const selectionControls = useSelection();
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);
    const [confirmModal, showConfirmModal] = useConfirmActionModal();

    const {
        items,
        selectedItems,
        isLoading,
        sortParams,
        handleOpenItem,
        handleSorting,
        isEmpty,
        handleRenderItem,
        layout,
        previewModal,
    } = useSharedWithMeItemsWithSelection();

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
        onSort: (sortField, direction) => {
            handleSorting({
                sortField,
                sortOrder: direction,
            });
        },
    };

    if (isEmpty) {
        return <EmptySharedWithMe />;
    }

    if (!selectionControls) {
        return <Loader />;
    }

    const selection: DriveExplorerSelection | undefined = {
        selectedItems: new Set(selectedItems.map((item) => getKeyUid(item))),
        selectionMethods: selectionControls,
    };

    const cells = getSharedWithMeCells({
        viewportWidth,
        showConfirmModal,
        contextMenuControls,
        selectionControls,
        onRenderItem: (uid) => {
            handleRenderItem({ id: uid });
        },
    });

    const grid = getSharedWithMeGrid({
        contextMenuControls,
        selectionControls,
    });

    const contextMenu = getSharedWithMeContextMenu({
        contextMenuControls,
        selectionControls,
    });

    const conditions: DriveExplorerConditions = {
        isDraggable: (uid) => {
            const item = useSharedWithMeListingStore.getState().sharedWithMeItems.get(uid);
            if (item && item.itemType === ItemType.INVITATION) {
                return false;
            }
            return true;
        },
        isDoubleClickable: (uid) => {
            const item = useSharedWithMeListingStore.getState().sharedWithMeItems.get(uid);
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
                    itemIds={items.map(({ id }) => id)}
                    layout={layout}
                    cells={cells}
                    grid={grid}
                    selection={selection}
                    events={events}
                    conditions={conditions}
                    sort={sort}
                    loading={isLoading}
                    caption={c('Title').t`Shared with me`}
                    contextMenu={contextMenu}
                />
            </div>
            {confirmModal}
            {previewModal}
        </ContactEmailsProvider>
    );
};

const SharedWithMeWrapper = () => {
    const isNewFileBrowserEnabled = useFlag('DriveWebNewFileBrowser');

    if (!isNewFileBrowserEnabled) {
        return <SharedWithMeOld />;
    }
    return <SharedWithMe />;
};

export default SharedWithMeWrapper;
