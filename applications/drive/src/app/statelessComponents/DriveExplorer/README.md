# DriveExplorer

DriveExplorer virtualized file browser component for Proton Drive. It provides both list and grid layout modes with support for selection, sorting, drag-and-drop, and context menus.

## Overview

DriveExplorer is a **stateless, presentation-only** component that:

- Renders items in List or Grid view with virtual scrolling
- Delegates all business logic to the consumer (data fetching, sorting, selection)
- Uses render functions for maximum flexibility
- Supports thousands of items with minimal performance impact

## Quick Example

```typescript
import { DriveExplorer } from '@/statelessComponents/DriveExplorer/DriveExplorer';

<DriveExplorer
    itemIds={['item-1', 'item-2', 'item-3']}
    layout={LayoutSetting.List}
    cells={cells}           // Column definitions for list view
    grid={grid}             // Render functions for grid view
    selection={selection}   // Selection state + methods
    events={events}         // User interaction callbacks
    sort={sort}            // Sort configuration
/>
```

For detailed prop documentation, see JSDoc comments in `DriveExplorer.tsx` and `types.ts`.

## Complete Usage Example

See **`sections/sharedWith/SharedWithMe.tsx`** for a complete implementation including:

- Cell definitions with Zustand integration
- Grid layout configuration
- Event handlers
- Conditional cell visibility
- Context menu integration

## Creating Custom Cell Components

### 1. Create the Cell Component

```typescript
// sections/mySection/driveExplorerCells/MyCustomCell.tsx
import { c } from 'ttag';
import type { CellDefinition } from '@/statelessComponents/DriveExplorer/types';
import { SortField } from '@/hooks/util/useSorting';

export interface MyCustomCellProps {
    uid: string;
    displayValue: string;
}

export function MyCustomCell({ displayValue }: MyCustomCellProps) {
    return <span className="text-ellipsis">{displayValue}</span>;
}

// Export config without render function
export const MyCustomCellConfig: Omit<CellDefinition, 'render'> = {
    id: 'myCustomCell',
    headerText: c('Label').t`Custom Column`,
    className: 'w-1/5',
    sortField: SortField.customField,
};
```

### 2. Add Cell to Section

```typescript
// sections/mySection/MySectionCells.tsx
import { useShallow } from 'zustand/react/shallow';
import { MyCustomCell, MyCustomCellConfig } from './driveExplorerCells/MyCustomCell';

export function getMySectionCells(): CellDefinition[] {
    return [
        {
            ...MyCustomCellConfig,
            render: (uid) => {
                // Create component wrapper to use hooks
                const CellComponent = () => {
                    const item = useMySectionStore(
                        useShallow((state) => state.getItem(uid))
                    );

                    if (!item) {
                        return null;
                    }

                    return <MyCustomCell uid={uid} displayValue={item.field} />;
                };

                return <CellComponent />;
            }
        }
    ];
}
```

### 3. Conditional Visibility

```typescript
{
    ...MyCustomCellConfig,
    disabled: !viewportWidth['>=large'], // Hide on small screens
    render: (uid) => { /* ... */ }
}
```

## Built-in Cell Components

- **NameCell** (`sections/commonDriveExplorerCells/NameCell.tsx`) - File/folder name with icon and signature
- **CheckboxCell** (`cells/CheckboxCell.tsx`) - Selection checkbox (automatically included)
- **ContextMenuCell** (`cells/ContextMenuCell.tsx`) - Three-dots menu button

For section-specific examples, see `sections/sharedWith/driveExplorerCells/`:

- `SharedByCell.tsx` - User avatar and name
- `SharedOnCell.tsx` - Formatted date/time
- `AcceptRejectCell.tsx` - Action buttons for invitations

## Key Features

### Virtual Scrolling

Only renders visible items using `@tanstack/react-virtual`. Handles thousands of items efficiently.

### Flexible Rendering

Uses render functions `(uid: string) => ReactNode` so consumers control:

- Data access (Zustand, props, context, etc.)
- Conditional rendering
- Custom styling

### Selection Management

Consumer provides selection state and methods. DriveExplorer handles:

- Click/Ctrl+Click/Shift+Click interactions
- Visual feedback
- Keyboard navigation

### Drag & Drop

Optional drag-and-drop support with:

- Multi-item dragging
- Drop target highlighting
- Custom drop validation

## Common Patterns

### Empty State

```typescript
if (items.length === 0) {
    return <EmptyState />;
}
return <DriveExplorer itemIds={items.map(i => i.id)} {...props} />;
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architectural documentation including:

- Component hierarchy
- Data flow diagrams
- Design principles
- Integration patterns
