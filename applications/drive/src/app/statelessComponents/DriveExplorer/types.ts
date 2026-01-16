import type { ReactNode } from 'react';

import type { SORT_DIRECTION } from '@proton/shared/lib/constants';

import type { SelectionState } from '../../modules/selection';
import type { SortConfig, SortField } from '../../modules/sorting/types';

export interface DragMoveControls {
    handleDragOver: (event: React.DragEvent<HTMLTableRowElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLTableRowElement>) => void;
    handleDragLeave: () => void;
    handleDragEnter: (e: React.DragEvent<HTMLTableRowElement>) => void;
    dragging: boolean;
    setDragging: (value: boolean) => void;
    isActiveDropTarget: boolean;
    selectedItemIds: string[];
    dragFeedbackText?: string;
    canDropIntoItem?: (uid: string) => boolean;
}

/**
 * Cell definition for list view columns
 *
 * @example
 * ```tsx
 * {
 *   id: 'name',
 *   headerText: 'Name',
 *   sortField: SortField.name,
 *   className: 'flex-1',
 *   width: '300px',
 *   disabled: !viewportWidth['>=large'],
 *   render: (uid) => <NameCell uid={uid} />
 * }
 * ```
 */
export interface CellDefinition {
    /** Unique identifier for this cell */
    id: string;
    /** Text shown in column header */
    headerText?: string;
    /** Sort field to enable sorting for this column */
    sortField?: SortField;
    /** Sort configuration array (can be multi-level) */
    sortConfig?: SortConfig;
    /** CSS classes for the cell */
    className?: string;
    /** Additional CSS classes for the header cell */
    headerClassName?: string;
    /** Fixed width (e.g., '200px', '20%') */
    width?: string;
    /** Hide this column when true */
    disabled?: boolean;
    /** data-testid for e2e testing TODO: Check if we can automate after full migration */
    testId?: string;
    /** Additional props passed to the <td> element */
    cellProps?: React.ComponentProps<'td'>;
    /**
     * Render function for cell content
     * @param uid - Item unique identifier
     * @returns React node to render in the cell
     */
    render: (uid: string) => ReactNode;
}

/**
 * Cell configuration without the render function
 * Used for defining reusable cell configurations
 */
export type CellDefinitionConfig = Omit<CellDefinition, 'render'>;

/**
 * Display configuration options
 */
export interface DriveExplorerConfig {
    /** Row height in pixels for list view (default: 44) */
    itemHeight?: number;
    /** Number of items to render outside viewport for smoother scrolling (default: 5) */
    overscan?: number;
    /** Gap between items in pixels (default: 0) */
    gap?: number;
    /** CSS class for the container element */
    className?: string;
    /** CSS class for the table element */
    tableClassName?: string;
    /** CSS class for the header element */
    headerClassName?: string;
}

/**
 * Selection methods interface
 */
export interface SelectionMethods {
    selectionState: SelectionState;
    selectItem: (uid: string) => void;
    toggleSelectItem: (uid: string) => void;
    toggleRange: (uid: string) => void;
    toggleAllSelected: () => void;
    clearSelections: () => void;
    isSelected: (uid: string) => boolean;
}

/**
 * Context menu controls interface
 */
export interface ContextMenuControls {
    isOpen: boolean;
    showContextMenu: (e: React.MouseEvent<Element>) => void;
    close: () => void;
}

/**
 * Selection state and methods
 */
export interface DriveExplorerSelection {
    /** Set of selected item UIDs */
    selectedItems: Set<string>;
    selectionMethods: SelectionMethods;
}

/**
 * Event callbacks for user interactions
 */
export interface DriveExplorerEvents {
    onItemClick?: (uid: string, event: React.MouseEvent) => void;
    onItemDoubleClick?: (uid: string, event: React.MouseEvent | React.KeyboardEvent | React.TouchEvent) => void;
    onItemContextMenu?: (uid: string, event: React.MouseEvent) => void;
    onItemRender?: (uid: string) => void;
}

/**
 * Item-specific behavior conditions
 */
export interface DriveExplorerConditions {
    isDraggable?: (uid: string) => boolean;
    isDoubleClickable?: (uid: string) => boolean;
}

/**
 * Sorting configuration
 */
export interface DriveExplorerSort {
    /** Current sort field */
    sortBy?: SortField;
    /** Current sort direction (ASC or DESC) */
    sortDirection?: SORT_DIRECTION;
    /** Called when user changes sort */
    onSort?: (params: { sortField: SortField; sortConfig: SortConfig; direction: SORT_DIRECTION }) => void;
}

/**
 * Grid view render functions
 *
 * @example
 * ```tsx
 * {
 *   name: (uid) => <div className="text-ellipsis">{getItemName(uid)}</div>,
 *   mainContent: (uid) => <FileIcon mimeType={getItemType(uid)} />
 * }
 * ```
 */
export interface GridDefinition {
    /**
     * Renders in the bottom name section of the grid item
     * @param uid - Item unique identifier
     */
    name: (uid: string) => ReactNode;
    /**
     * Renders in the main content area (icon/thumbnail)
     * @param uid - Item unique identifier
     */
    mainContent: (uid: string) => ReactNode;
}
