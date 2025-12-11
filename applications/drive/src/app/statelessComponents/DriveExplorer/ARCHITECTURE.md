# DriveExplorer Architecture

DriveExplorer virtualized file browser component for Proton Drive. It provides both list and grid layout modes with support for selection, sorting, drag-and-drop, and context menus.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      DriveExplorer                          │
│              (Main Container Component)                      │
│  • Handles layout switching (List/Grid)                     │
│  • Manages container-level events                           │
│  • Coordinates header and body components                   │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌──────────────────┐                  ┌──────────────────┐
│ DriveExplorer    │                  │ DriveExplorer    │
│ Header           │                  │ Body/GridBody    │
│                  │                  │                  │
│ • Selection UI   │                  │ • Virtualization │
│ • Sort controls  │                  │ • Row/Grid items │
│ • Checkboxes     │                  │ • Interactions   │
└──────────────────┘                  └──────────────────┘
                                                │
                        ┌───────────────────────┴───────────────────┐
                        ▼                                           ▼
                ┌──────────────────┐                      ┌──────────────────┐
                │ DriveExplorer    │                      │ DriveExplorer    │
                │ Row              │                      │ GridBox          │
                │                  │                      │                  │
                │ • Table row      │                      │ • Grid cell      │
                │ • Drag & drop    │                      │ • Drag & drop    │
                │ • Selection      │                      │ • Selection      │
                └──────────────────┘                      └──────────────────┘
                        │                                           │
                        ▼                                           ▼
                ┌──────────────────┐                      ┌──────────────────┐
                │ DriveExplorer    │                      │ Grid Definition  │
                │ Cell             │                      │ (name/content)   │
                │                  │                      │                  │
                │ • Renders cell   │                      │ • Custom render  │
                │   content        │                      │   functions      │
                └──────────────────┘                      └──────────────────┘
```

## Key Components

### Entry Point

- **DriveExplorer** (`DriveExplorer.tsx`)
    - Main container component and public API
    - Switches between list and grid layouts
    - Handles container-level click and keyboard events
    - Manages selection clearing (Escape key, click on empty space)

### Header Layer

- **DriveExplorerHeader** (`DriveExplorerHeader.tsx`)
    - Renders table header with column titles
    - Manages select-all checkbox state (none/some/all)
    - Provides sort controls:
        - Column headers with sort direction indicators
        - Grid mode: Dropdown menu for sort field selection
        - List mode: Clickable column headers
    - Displays selection count
    - Adapts UI based on layout mode (List/Grid)
    - Sticky positioning during scroll

### Body Layer

- **DriveExplorerBody** (`DriveExplorerBody.tsx`)
    - List view body with table-based layout
    - Uses `@tanstack/react-virtual` for list virtualization
    - Renders DriveExplorerRow components
    - Uses IntersectionObserver for item visibility tracking
    - Optimizes performance by only rendering visible rows

- **DriveExplorerGridBody** (`DriveExplorerGridBody.tsx`)
    - Grid view body with CSS Grid layout
    - Uses `@tanstack/react-virtual` for grid virtualization (rows)
    - Dynamically calculates grid dimensions based on container width
    - Responsive cell sizing (13.5rem width × 12.25rem height base)
    - Renders DriveExplorerGridBox components
    - Uses IntersectionObserver for item visibility tracking

### Item Layer

- **DriveExplorerRow** (`DriveExplorerRow.tsx`)
    - Individual table row for list view
    - Renders CheckboxCell + custom cells + optional context menu
    - Integrates `useDragMove` for drag-and-drop
    - Connects to `useItemInteraction` for all user interactions
    - Supports drop targets for folders
    - Virtual positioning via transform: translateY

- **DriveExplorerGridBox** (`DriveExplorerGridBox.tsx`)
    - Individual grid item for grid view
    - Two sections:
        - Main content area (icon/thumbnail)
        - Bottom name area with optional context menu
    - Checkbox positioned absolutely (top-left corner)
    - Same interaction and drag-and-drop logic as Row
    - Border changes on selection (border-primary)

### Cell Layer

- **DriveExplorerCell** (`DriveExplorerCell.tsx`)
    - Wrapper for rendering individual table cells
    - Applies cell configuration (width, className, styles)
    - Calls the cell's render function with item UID
    - Used only in list view

- **Built-in Cells** (`cells/`)
    - `CheckboxCell`: Selection checkbox with expand-click-area
    - `ContextMenuCell`: Three-dots menu button
    - `EmptyCell`: Placeholder for disabled/hidden cells

### Common Cell Definitions

Located in `sections/commonDriveExplorerCells/`:

- **NameCell** - File/folder name with icon and signature indicator
    - Shows thumbnail or FileIcon
    - Displays signature issues
    - Grayscale filter for invitations

Cell definitions follow a pattern where configuration is separated from render functions, which are typically defined in section-specific files (e.g., `SharedWithMeCells.tsx`).

## Supporting Hooks & Utilities

### Virtualization

- **useListVirtualizer** (`useListVirtualizer.ts`)
    - Wraps `@tanstack/react-virtual` for list mode
    - Configuration: itemHeight, overscan, gap
    - Returns virtualizer with `getTotalSize()` and `getVirtualItems()`

- **useGridVirtualizer** (`useGridVirtualizer.ts`)
    - Wraps `@tanstack/react-virtual` for grid mode
    - Virtualizes rows (not individual cells)
    - Configuration: itemsPerRow, rowHeight, overscan, gap
    - Calculates row count from total items

### Interaction Management

- **useItemInteraction** (`useItemInteraction.ts`)
    - Centralizes all item interaction logic
    - Handles:
        - Click selection (single/Ctrl/Shift)
        - Double-click to open
        - Context menu (right-click)
        - Keyboard navigation (Space/Enter)
        - Drag start
    - Prevents interaction on buttons/inputs
    - Integrates with selection methods

- **useItemVisibility** (`useItemVisibility.ts`)
    - Uses IntersectionObserver API
    - Tracks which items become visible
    - Calls `onItemRender` callback once per item
    - Useful for lazy-loading thumbnails/metadata
    - Configuration: threshold (0.1), rootMargin (50px)

## Key Design Principles

### Separation of Concerns

DriveExplorer is **purely presentational**. It does not:

- Manage item data (consumers pass itemIds and provide render functions)
- Handle business logic (consumers provide event callbacks)
- Control selection state (consumers provide selection methods)
- Perform sorting (consumers provide sorted itemIds)

This makes it reusable across different Drive sections (Shared With Me, My Files, Trash, etc.).

### Render Function Pattern

Cells and grid content use render functions `(uid: string) => ReactNode`, allowing custom data access per section, conditional rendering based on item state, and lazy component instantiation.

### Virtual Scrolling

Uses `@tanstack/react-virtual` for performance:

- Only renders visible items + overscan
- Smooth scrolling with GPU-accelerated transforms
- Handles thousands of items efficiently
- Adaptive item sizing

### Conditional Rendering

Cells can be disabled dynamically:

```typescript
{
    ...NameCellConfig,
    disabled: !viewportWidth['>=large'], // Hide on small screens
    render: (uid) => <NameCell ... />
}
```

Disabled cells are filtered out during rendering.

## Integration Pattern

Typical usage in a Drive section:

```typescript
// 1. Define section-specific cells
const cells = getSectionCells({ ...config });

// 2. Define grid layout (for grid view)
const grid = getSectionGrid({ ...config });

// 3. Define context menu renderer
const contextMenu = getSectionContextMenu({ ...config });

// 4. Set up events
const events: DriveExplorerEvents = {
    onItemDoubleClick: handleOpenItem,
    onItemRender: handleRenderItem,
    // ...
};

// 5. Set up conditions
const conditions: DriveExplorerConditions = {
    isDraggable: (uid) => !isItemInvitation(uid),
    isDoubleClickable: (uid) => !isItemInvitation(uid),
};

// 6. Render DriveExplorer
<DriveExplorer
    itemIds={itemIds}
    layout={layout}
    cells={cells}
    grid={grid}
    selection={selection}
    events={events}
    conditions={conditions}
    contextMenu={contextMenu}
/>
```
