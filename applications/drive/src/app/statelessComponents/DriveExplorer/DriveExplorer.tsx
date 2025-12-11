/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { useCallback, useRef } from 'react';

import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import clsx from '@proton/utils/clsx';

import { DriveExplorerBody } from './DriveExplorerBody';
import { DriveExplorerGridBody } from './DriveExplorerGridBody';
import { DriveExplorerHeader } from './DriveExplorerHeader';
import type {
    CellDefinition,
    DragMoveControls,
    DriveExplorerConditions,
    DriveExplorerConfig,
    DriveExplorerEvents,
    DriveExplorerSelection,
    DriveExplorerSort,
    GridDefinition,
} from './types';

/**
 * DriveExplorer component props
 *
 * @example
 * ```tsx
 * <DriveExplorer
 *     itemIds={['item-1', 'item-2']}
 *     layout={LayoutSetting.List}
 *     cells={cells}
 *     grid={grid}
 *     selection={selection}
 *     events={{ onItemDoubleClick: handleOpen }}
 * />
 * ```
 */
export interface DriveExplorerProps {
    /**
     * Array of unique item identifiers to display.
     * Order determines display order in the list/grid.
     *
     * @example ['uid-1', 'uid-2', 'uid-3']
     */
    itemIds: string[];

    /**
     * Display layout mode.
     * - LayoutSetting.List: Table view with columns
     * - LayoutSetting.Grid: Responsive grid of cards
     */
    layout: LayoutSetting;

    /**
     * Column definitions for list view.
     * Each cell defines how to render a column.
     *
     * @example
     * ```tsx
     * [{
     *   id: 'name',
     *   headerText: 'Name',
     *   sortField: SortField.name,
     *   className: 'flex-1',
     *   render: (uid) => <NameCell uid={uid} />
     * }]
     * ```
     */
    cells: CellDefinition[];

    /**
     * Custom render functions for grid view.
     * - name: Renders in the bottom section
     * - mainContent: Renders in the main content area (icon/thumbnail)
     *
     * @example
     * ```tsx
     * {
     *   name: (uid) => <div>{getItemName(uid)}</div>,
     *   mainContent: (uid) => <FileIcon uid={uid} />
     * }
     * ```
     */
    grid: GridDefinition;

    /**
     * Display configuration (item height, overscan, gaps, CSS classes).
     *
     * @example
     * ```tsx
     * {
     *   itemHeight: 44,
     *   overscan: 5,
     *   className: 'my-custom-class'
     * }
     * ```
     */
    config?: DriveExplorerConfig;

    /**
     * Selection state and methods.
     *
     * @example
     * ```tsx
     * {
     *   selectedItems: new Set(['uid-1']),
     *   selectionMethods: {
     *     selectItem,
     *     toggleSelectItem,
     *     toggleRange,
     *     toggleAllSelected,
     *     clearSelections,
     *     isSelected,
     *     selectionState: SelectionState.SOME
     *   }
     * }
     * ```
     */
    selection: DriveExplorerSelection;

    /**
     * Event callbacks for user interactions.
     *
     * @example
     * ```tsx
     * {
     *   onItemDoubleClick: (uid) => openItem(uid),
     *   onItemRender: (uid) => loadThumbnail(uid),
     *   onItemContextMenu: (uid, event) => showContextMenu(uid, event)
     * }
     * ```
     */
    events?: DriveExplorerEvents;

    /**
     * Sorting configuration.
     *
     * @example
     * ```tsx
     * {
     *   sortBy: SortField.name,
     *   sortDirection: SORT_DIRECTION.ASC,
     *   onSort: (field, direction) => handleSort(field, direction)
     * }
     * ```
     */
    sort?: DriveExplorerSort;

    /**
     * Item-specific behavior conditions.
     *
     * @example
     * ```tsx
     * {
     *   isDraggable: (uid) => !isItemLocked(uid),
     *   isDoubleClickable: (uid) => !isItemInvitation(uid)
     * }
     * ```
     */
    conditions?: DriveExplorerConditions;

    /**
     * Shows loading indicator at bottom of list.
     * Useful for infinite scroll/pagination.
     */
    loading?: boolean;

    /**
     * Accessibility caption for the table.
     *
     * @example "My Files"
     */
    caption?: string;

    /**
     * Drag-and-drop handlers for moving items.
     * Includes drag state, drop validation, and event handlers.
     */
    dragMoveControls?: DragMoveControls;

    /**
     * Disable multi-selection (Ctrl/Shift+click).
     * When true, only single selection is allowed.
     */
    isMultiSelectionDisabled?: boolean;

    /**
     * Show/hide the checkbox column.
     *
     * @default true
     */
    showCheckboxColumn?: boolean;

    /**
     * Function that renders context menu button for each item.
     *
     * @example
     * ```tsx
     * (uid) => (
     *   <ContextMenuCell
     *     isActive={isMenuOpen && isSelected(uid)}
     *     onClick={(e) => showMenu(uid, e)}
     *   />
     * )
     * ```
     */
    contextMenu?: (uid: string) => React.ReactNode;
}

/**
 * High-performance, virtualized file browser component.
 *
 * DriveExplorer is a stateless presentation component that displays items in
 * list or grid view with virtual scrolling. It delegates all business logic
 * (data fetching, sorting, selection) to the consumer.
 *
 * ## Features
 * - Virtual scrolling for thousands of items
 * - List and Grid layout modes
 * - Selection with keyboard support
 * - Sortable columns
 * - Drag and drop
 * - Context menus
 *
 * ## Example
 * ```tsx
 * <DriveExplorer
 *     itemIds={items.map(i => i.id)}
 *     layout={LayoutSetting.List}
 *     cells={getMySectionCells()}
 *     grid={getMySectionGrid()}
 *     selection={selection}
 *     events={{ onItemDoubleClick: handleOpen }}
 *     sort={sort}
 * />
 * ```
 *
 * For complete usage examples, see sections/sharedWith/SharedWithMe.tsx
 */

const DriveExplorer = ({
    itemIds,
    layout,
    cells,
    grid,
    config,
    selection,
    events,
    conditions,
    sort,
    loading = false,
    caption,
    dragMoveControls,
    isMultiSelectionDisabled,
    showCheckboxColumn = true,
    contextMenu,
}: DriveExplorerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const driveExplorerRef = useRef<HTMLDivElement>(null);

    const handleContainerClick = useCallback(
        (event: React.MouseEvent) => {
            const target = event.target as HTMLElement;
            const isClickOnEmptySpace =
                target === event.currentTarget ||
                (target.closest('[data-testid="drive-explorer-row"]') === null &&
                    target.closest('[data-testid="grid-item"]') === null);

            if (isClickOnEmptySpace && selection?.selectionMethods) {
                selection.selectionMethods.clearSelections();
            }
        },
        [selection]
    );

    const handleContainerKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Escape' && selection?.selectionMethods) {
                selection.selectionMethods.clearSelections();
                event.preventDefault();
            }
            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
            }
        },
        [selection]
    );

    return (
        <div
            ref={driveExplorerRef}
            className={clsx('drive-explorer flex flex-column w-full h-full', config?.className)}
            onClick={handleContainerClick}
            onKeyDown={handleContainerKeyDown}
            role="application"
        >
            <DriveExplorerHeader
                selection={selection}
                sort={sort}
                caption={caption}
                config={config}
                containerRef={containerRef}
                cells={cells}
                itemCount={itemIds.length}
                layout={layout}
                loading={loading}
                showCheckboxColumn={showCheckboxColumn}
            />
            {layout === LayoutSetting.Grid ? (
                <DriveExplorerGridBody
                    itemIds={itemIds}
                    grid={grid}
                    containerRef={containerRef}
                    selection={selection}
                    events={events}
                    conditions={conditions}
                    loading={loading}
                    config={config}
                    isMultiSelectionDisabled={isMultiSelectionDisabled}
                    dragMoveControls={dragMoveControls}
                    showCheckboxColumn={showCheckboxColumn}
                    contextMenu={contextMenu}
                />
            ) : (
                <DriveExplorerBody
                    cells={cells}
                    itemIds={itemIds}
                    containerRef={containerRef}
                    config={config}
                    events={events}
                    conditions={conditions}
                    loading={loading}
                    selection={selection}
                    dragMoveControls={dragMoveControls}
                    isMultiSelectionDisabled={isMultiSelectionDisabled}
                    showCheckboxColumn={showCheckboxColumn}
                    contextMenu={contextMenu}
                />
            )}
        </div>
    );
};

export { DriveExplorer };
