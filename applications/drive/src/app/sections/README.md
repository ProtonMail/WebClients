# Sections — Golden Structure

A section represents a self-contained part of the Drive UI (e.g. `publicPage/`, `folders/`, `trash/`, `sharedWith/`). Each section:

- Owns its own state, actions, and business logic
- Can **theoretically** be extracted and reused elsewhere without modification
- May or may not use `DriveExplorer` (file/folder list view) — some sections show explorer views (folders, trash), others don't (publicPage single file view, sidebar panels)
- Follows a consistent structure to ensure predictability and maintainability

## Shared Resources

At the `sections/` level, there are shared resources used across multiple sections:

- **`commonButtons/`** — Reusable action buttons (Rename, Delete, Download, etc.) that work in both toolbars and context menus
- **`commonDriveExplorerCells/`** — Reusable table cell components for the file explorer (Name, Size, Modified, etc.)

Individual sections can reference these shared resources or define their own section-specific buttons/cells when needed.

## Directory Layout

```
sections/
├── commonButtons/                      # Shared action buttons used across sections
│   ├── types.ts                        # CommonButtonProps type
│   ├── RenameButton.tsx
│   ├── DeleteButton.tsx
│   └── DownloadButton.tsx
│
├── commonDriveExplorerCells/           # Shared table cells used across sections
│   ├── NameCell.tsx
│   ├── SizeCell.tsx
│   └── ModifiedCell.tsx
│
└── sectionName/
    ├── connectedComponents/            # Section-scoped components wired to state/business logic
    │   ├── SectionButton.tsx
    │   └── SectionEmptyView.tsx
    │
    ├── statelessComponents/            # Section-scoped presentational components (no state, no business logic)
    │   └── SectionBanner.tsx
    │
    ├── actions/                        # Action logic & components
    │   ├── useSectionActions.ts        # Central hook: pure action handlers + modals
    │   ├── actionsItemsChecker.ts      # Pure logic: determines available actions
    │   ├── SectionItemContextMenu.tsx  # Right-click context menu
    │   ├── SectionToolbarMenu.tsx      # Toolbar menu
    │   └── SectionActions.tsx          # Action buttons for viewers (if role-based)
    │
    ├── driveExplorerCells/             # Section-specific table cells for the file explorer
    │   └── CustomCell.tsx
    │
    ├── SectionView.tsx                 # Main view (folder browse, file preview, etc.)
    ├── SectionDriveExplorerCells.tsx   # Cell definitions for the explorer
    │
    ├── useSection.store.ts             # Zustand store: section-specific state
    ├── useSectionLoader.ts             # Async data loading hook
    ├── subscribeTo*Events.ts           # Event subscription for real-time updates
    │
    ├── constants.ts                    # Section-specific constants
    └── section.sorting.ts              # Sort value extraction logic
```

## `useSectionActions` — Actions Hook

The actions hook is the single source of truth for all user-triggered operations in a section. It must remain **pure**: it only contains action handlers and modal wiring. No side effects (event subscriptions, data fetching on mount, store hydration) belong here.

### Structure

```typescript
export const useSectionActions = () => {
    // 1. Modal instantiation
    const { modal: previewModal, showModal: showPreviewModal } = usePreviewModal();

    // 2. Pure action handlers — each handler does ONE thing
    const handlePreview = (uid: string) => {
        showPreviewModal({
            /* ... */
        });
    };

    const handleDownload = async (uids: string[]) => {
        await downloadManager.download(uids);
    };

    // 3. Return: modals object + flat handlers
    return {
        modals: {
            previewModal,
        },
        handlePreview,
        handleDownload,
    };
};
```

### Rules

| Rule | Why |
| --- | --- |
| No side effects on mount | The hook is instantiated once in the view. It must not trigger data fetching, subscriptions, or store mutations just by being called. |
| Handlers are the only entry points | Every user action (click, context menu) goes through a `handle*` function. No business logic lives in components. |
| Modal elements returned in `modals` | The parent view renders them: `{modals.previewModal}`. This keeps modal lifecycle tied to the view, not scattered across children. |
| Actions interact with SDK / managers directly | Handlers call the SDK client or managers (download, upload) and let the event system propagate changes back to the store. |

## `actionsItemsChecker` — Action Availability

Pure function that takes the current selection and returns a flat object of booleans describing what actions are available. Components use this to decide which buttons / menu items to render.

```typescript
export interface SectionItemChecker {
    canEdit: boolean;
    canDownload: boolean;
    // ...section-specific booleans
}

export const createItemChecker = (items: SectionItem[]): SectionItemChecker => {
    const firstItem = items.at(0);
    const isOnlyOneItem = items.length === 1 && !!firstItem;

    return {
        canEdit: isOnlyOneItem && /* section-specific rule */,
        canDownload: items.length > 0,
    };
};
```

- **Pure function**: items in, flat booleans out. No mutations, no side effects.
- **Can read from stores** via `store.getState()` for context (role, user), but never writes.
- **No UI concerns**: returns capabilities, the consumer decides what to render.

## `useSection.store` — Zustand Store

The store is a data mirror of the view. It holds two parallel structures:

- **`sortedItemUids: Set<string>`** — the sorted list of IDs currently visible. Only mutated on add/remove or when sort order changes.
- **`items: Map<string, SectionItem>`** — the full item data. Mutated on any data change (rename, metadata update, etc.).

The view subscribes to `sortedItemUids` to know _what_ to render and _in what order_. When it needs item data, it reads from the Map by uid. This separation means updating an item's name does not cause the entire list to re-render — only the row that reads that item re-renders.

### Structure

```typescript
interface SectionStore {
    items: Map<string, SectionItem>;
    sortedItemUids: Set<string>;
    isLoading: boolean;

    setItem: (item: SectionItem) => void;
    updateItem: (uid: string, updates: Partial<SectionItem>) => void;
    removeItem: (uid: string) => void;
    clearAll: () => void;

    getItem: (uid: string) => SectionItem | undefined;

    setLoading: (loading: boolean) => void;

    sortField: SortField;
    direction: SORT_DIRECTION;
    sortConfig: SortConfig | undefined;
    setSorting: (params: { sortField: SortField; direction: SORT_DIRECTION; sortConfig: SortConfig }) => void;
}
```

### Mutation rules

| Operation                  | Touches `sortedItemUids` | Touches `items`                         |
| -------------------------- | ------------------------ | --------------------------------------- |
| Add item (`setItem`)       | Yes — add uid            | Yes — set in Map                        |
| Update item (`updateItem`) | No                       | Yes — merge partial into existing entry |
| Remove item (`removeItem`) | Yes — delete uid         | Yes — delete from Map                   |
| Clear (`clearAll`)         | Yes — new empty Set      | Yes — new empty Map                     |
| Sort (`setSorting`)        | Yes — reordered Set      | No                                      |

### Reading from the store

**Reactive (in components)** — use `useShallow` strategically:

```typescript
// Selecting a single primitive — NO useShallow needed (Zustand does referential equality by default)
const name = useSectionStore((state) => state.getItem(uid)?.name);

// Selecting multiple values — USE useShallow to avoid re-renders when unrelated state changes
const { name, size, type } = useSectionStore(
    useShallow((state) => {
        const item = state.getItem(uid);
        return { name: item?.name, size: item?.size, type: item?.type };
    })
);

// Deriving an array — USE useShallow for value-based equality
const sortedItemUids = useSectionStore(useShallow((state) => Array.from(state.sortedItemUids)));

// Selecting stable functions/actions — NO useShallow needed
const setItem = useSectionStore((state) => state.setItem);
```

**Non-reactive (in actions, event handlers, loaders)** — use `getState()` for one-shot reads:

```typescript
const item = useSectionStore.getState().getItem(uid);
const allItems = useSectionStore.getState().items;
```

`getState()` does not subscribe — it reads the current value and moves on. Use it everywhere outside of React rendering (action handlers, event subscriptions, loaders).

## `subscribeTo*Events` — Event Subscription

Listens to events from the `BusDriver` and keeps the store in sync. Called from the view on mount, returns an unsubscribe function.

> **BusDriver** is the event bus for Drive. See `packages/drive/internal/BusDriver` for implementation details.

```typescript
export const subscribeToSectionEvents = (): (() => void) => {
    return busDriver.subscribe((event) => {
        // Map each event type to a store mutation
    });
};
```

Typical event-to-store mapping:

| Event           | Store action                         |
| --------------- | ------------------------------------ |
| `CREATED_NODES` | `setItem` (add to Map + Set)         |
| `RENAMED_NODES` | `updateItem` (update Map only)       |
| `UPDATED_NODES` | `updateItem` (update Map only)       |
| `MOVED_NODES`   | `removeItem` if out of scope         |
| `DELETED_NODES` | `removeItem` (remove from Map + Set) |

- Lives in its own file, not inside the store or the view.
- Only writes to the store — never reads from React state or triggers UI directly.
- The view re-renders automatically because it subscribes to the store.

## `section.sorting.ts` — Sort Value Extraction

A single function that maps a `SectionItem` + `SortField` to the sortable value. Used by the store's `setSorting` method together with comparators from `modules/sorting`.

```typescript
export function getSectionSortValue(item: SectionItem, field: SortField): unknown {
    switch (field) {
        case SortField.name:
            return item.name;
        case SortField.nodeType:
            return item.type;
        case SortField.size:
            return item.size;
        default:
            return undefined;
    }
}
```

- One function per section — each section knows which fields its items support.
- Returns `undefined` for unsupported fields.
- Pure extraction, no comparison logic — comparators live in `modules/sorting`.

The store's `setSorting` applies the sorting strategy to reorder all `sortedItemUids`:

```typescript
setSorting: ({ sortField, direction, sortConfig }) => {
    const allItems = get().items;
    const sortedUids = sortItems(allItems, sortConfig, direction, getSectionSortValue, (item) => item.uid);
    set({ sortField, direction, sortConfig, sortedItemUids: new Set(sortedUids) });
},
```

This method:

1. Sets the sorting strategy (field, direction, config)
2. Applies it immediately to reorder all current items
3. Updates `sortedItemUids` with the new order (items Map stays untouched)

`sortItems` (from `modules/sorting`) takes the items, sort config (field + comparator pairs), and the section's `getSectionSortValue` to extract comparable values. The result is a new ordered array of uids. If the order hasn't changed, avoid creating a new Set instance to prevent unnecessary re-renders.

## Common Buttons (`sections/commonButtons/`)

Action buttons render in two contexts: **toolbar** (top bar) or **context menu** (right-click). They share behavior but use different UI components. A shared generic type enforces correct props per context.

### Shared Type (`sections/commonButtons/types.ts`)

```typescript
export type CommonButtonProps<T = {}> =
    | (T & { buttonType: 'toolbar'; onClick: () => void; close?: never })
    | (T & { buttonType: 'contextMenu'; onClick: () => void; close: () => void });
```

- **Toolbar**: `close` must never be provided
- **Context menu**: `close` is required (to dismiss the menu after action)
- `T` allows button-specific props (e.g., `{ withScan?: boolean }` for DownloadButton)

### Button Implementation

```typescript
import { ToolbarButton } from '@proton/components';
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';
import { ContextMenuButton } from '../../components/sections/ContextMenu';
import type { CommonButtonProps } from './types';

type Props = CommonButtonProps;

export const RenameButton = ({ buttonType, close, onClick }: Props) => {
    const title = c('Action').t`Rename`;
    const icon = 'pen-square';

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcPenSquare alt={title} />}
                onClick={onClick}
                data-testid="toolbar-rename"
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={icon}
                testId="context-menu-rename"
                action={onClick}
                close={close}
            />
        );
    }
};
```

For buttons with additional props:

```typescript
type Props = CommonButtonProps<{ withScan?: boolean }>;

export const DownloadButton = ({ buttonType, onClick, close, withScan = false }: Props) => {
    const title = withScan ? c('Action').t`Scan and Download` : c('Action').t`Download`;
    // ...
};
```

### Usage

```typescript
// In toolbar
<RenameButton buttonType="toolbar" onClick={handleRename} />

// In context menu
<RenameButton buttonType="contextMenu" onClick={handleRename} close={closeContextMenu} />
```
