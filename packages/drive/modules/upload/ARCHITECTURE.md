# Upload Module Architecture

The upload system is organized into several layers:

```
┌─────────────────────────────────────────────────────────────┐
│                      UploadManager                          │
│              (Public API - Entry Point)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   UploadOrchestrator                        │
│        (Main Loop - Coordinates Everything)                 │
│  • Polls queue for tasks                                    │
│  • Delegates execution to executors                         │
│  • Manages lifecycle                                        │
└─────────────────────────────────────────────────────────────┘
         │           │            │            │
         ▼           ▼            ▼            ▼
   ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐
   │ Event   │ │Conflict  │ │Capacity  │ │SDK Transfer   │
   │ Handler │ │Manager   │ │Manager   │ │Activity       │
   └─────────┘ └──────────┘ └──────────┘ └───────────────┘
         │           │
         ▼           ▼
   ┌───────────────────────────────┐
   │  Task Executors               │
   │  • FileUploadExecutor         │
   │  • FolderCreationExecutor     │
   └───────────────────────────────┘
```

## Key Components

### Entry Point

- **UploadManager** (`UploadManager.ts`)
    - Public API for uploads
    - Provides two upload methods:
        - `upload()` - Regular Drive uploads (requires parentUid)
        - `uploadPhotos()` - Photos uploads (no parentUid)
    - Handles file/folder structure building
    - Supports drag & drop via DataTransferItemList
    - Starts/stops orchestrator
    - Exposes conflict resolution

### Orchestration Layer

- **UploadOrchestrator** (`orchestration/UploadOrchestrator.ts`)
    - Main coordination loop
    - Polls queue and schedules tasks
    - Manages component lifecycle
- **UploadEventHandler** (`orchestration/UploadEventHandler.ts`)
    - Processes events from executors
    - Delegates to specialized managers
- **ConflictManager** (`orchestration/ConflictManager.ts`)
    - Detects file/folder naming conflicts
    - Manages conflict resolution strategies (skip/rename/replace)
    - Supports custom conflict resolver callback or defaults to Rename strategy
    - Handles "apply to all" batch resolution per node type (files/folders separate)
    - Queues concurrent conflicts to ensure sequential resolution
    - Manages folder children cancellation
- **SDKTransferActivity** (`orchestration/SDKTransferActivity.ts`)
    - Tracks SDK pause/resume events
    - Manages transfer activity state
    - Auto-unsubscribes when queue is empty

### Execution Layer

- **TaskExecutor** (`execution/TaskExecutor.ts`)
    - Abstract base class for all executors
    - Ensures consistent API (`execute()`, `setEventCallback()`)
- **FileUploadExecutor** (`execution/FileUploadExecutor.ts`)
    - Executes regular file uploads to Drive via SDK
    - Requires parentUid for upload location
    - Generates thumbnails
    - Handles upload progress tracking
    - Emits events (started, progress, complete, error, conflict)
- **PhotosUploadExecutor** (`execution/PhotosUploadExecutor.ts`)
    - Executes photo uploads via SDK
    - No parentUid required (uses photos-specific API)
    - Handles duplicate photo detection
    - Generates thumbnails and extracts EXIF data
    - Emits events (started, progress, complete, photo:exist, error)
- **FolderCreationExecutor** (`execution/FolderCreationExecutor.ts`)
    - Creates folders via SDK
    - Emits events (complete, error, conflict)

### Scheduling Layer

- **CapacityManager** (`scheduling/CapacityManager.ts`)
    - Tracks concurrent upload limits
    - Monitors active files and folders
    - Calculates remaining upload bytes

### State Management

- **uploadQueue.store** (`store/uploadQueue.store.ts`)
    - Zustand store for upload queue state
    - Tracks all upload items and their status
    - Manages first conflict item for UI
- **uploadController.store** (`store/uploadController.store.ts`)
    - Zustand store for SDK upload controllers
    - Maps uploadId to abort/upload controllers

## Data Flow

### Upload Flow

```
1. User initiates upload
   ↓
2. UploadManager.uploadFiles()
   - Builds file/folder structure
   - Adds items to queue
   ↓
3. UploadManager.start()
   - Starts UploadOrchestrator
   ↓
4. UploadOrchestrator main loop
   - Gets next tasks from schedulerHelpers
   - Executes via FileUploadExecutor/FolderCreationExecutor
   ↓
5. Executor emits events
   ↓
6. UploadEventHandler processes events
   - Updates queue store
   - Delegates to ConflictManager if conflict
   ↓
7. Loop continues until queue empty
```

### Conflict Resolution Flow

```
1. Executor encounters conflict
   ↓
2. Emits 'file:conflict' or 'folder:conflict' event
   ↓
3. Event emitted to subscribers (for observability)
   ↓
4. ConflictManager.handleConflict()
   - Checks for existing batch strategy (skip if found)
   - Queues if another conflict is being resolved
   - Marks item as ConflictFound
   ↓
5. Calls conflictResolver callback (if set)
   - Passes name, nodeType, conflictType, batchId
   - Awaits user decision
   ↓
   OR (if no resolver set)
   ↓
   Defaults to Rename strategy
   ↓
6. ConflictManager.chooseConflictStrategy()
   - Applies chosen strategy
   - If applyToAll=true, sets batch strategy for node type
   - Resolves other pending conflicts with same criteria
   ↓
7. Calls retryWithStrategy()
   - Updates queue with resolution
   - For Skip: cancels folder children
   - For Rename: generates new name and resets to Pending
   - For Replace: marks folder as Finished, updates children's parentUid
   ↓
8. Orchestrator picks up resolved item
```

## Key Concepts

### Event-Driven Architecture

Executors don't access stores directly. They emit events that are processed by the UploadEventHandler, maintaining separation of concerns.

### Dependency Resolution

Folders must be created before their children. The scheduler ensures:

- Parent folders are created first (sorted by depth)
- Files only upload after their parent folder exists
- Children are cancelled if parent fails

### Batch Processing

Items uploaded together share a `batchId`. This enables:

- "Apply to all" conflict resolution per node type (files and folders handled separately)
- Setting batch strategies for automatic resolution of future conflicts
- Batch cancellation

**Important:** Batch strategies are node-type specific. If a user chooses "Replace All" for a file conflict, it only applies to files in that batch, not folders.

## File Structure

```
upload/
├── ...
├── index.ts                           # Public exports
├── types.ts                           # TypeScript types
├── constants.ts                       # Configuration constants
├── UploadManager.ts                   # Public API entry point
│
├── orchestration/                    # Coordination layer
│   ├── UploadOrchestrator.ts         # Main coordination loop
│   ├── UploadEventHandler.ts         # Event processing
│   ├── ConflictManager.ts            # Conflict resolution
│   └── SDKTransferActivity.ts        # SDK event tracking
│
├── execution/                        # Task execution layer
│   ├── TaskExecutor.ts               # Abstract base class
│   ├── FileUploadExecutor.ts         # File uploads
│   └── FolderCreationExecutor.ts     # Folder creation
│
├── scheduling/                       # Scheduling & capacity
│   └── CapacityManager.ts            # Concurrency limits
│
├── store/                            # State management
│   ├── uploadQueue.store.ts          # Upload queue state
│   └── uploadController.store.ts     # SDK controllers
│
└── utils/
    ├── ...
    ├── schedulerHelpers.ts           # Task scheduling logic
    ├── dependencyHelpers.ts          # Dependency resolution
    ├── buildFolderStructure.ts       # Folder tree building
    ├── hasFolderStructure.ts         # Folder detection
    ├── processDroppedItems.ts        # Drag & drop handling
    ├── processFileSystemEntry.ts     # FileSystem API traversal
    └── shouldIgnoreFile.ts           # File filtering
```
