# Upload Manager

SDK-based upload system for Proton Drive. Handles file and folder uploads with conflict resolution, progress tracking, and queue management.

## Quick Start

```typescript
import { UploadConflictStrategy, uploadManager, useUploadQueueStore } from '@proton/drive/modules/upload';

// Upload files
await uploadManager.upload(files, parentNodeUid);

// Upload from drag & drop
await uploadManager.uploadDrop(dataTransferItems, fileList, parentNodeUid);

// Monitor upload queue
const queue = useUploadQueueStore((state) => state.queue);
```

## API

### uploadManager

Global singleton instance. Provides the main upload interface.

#### `upload(files: File[] | FileList, parentUid: string): Promise<void>`

Upload files or folders to a parent node. Automatically detects folder structures from `webkitRelativePath`.

```typescript
await uploadManager.upload(fileInput.files, parentNodeUid);
```

#### `uploadDrop(items: DataTransferItemList, fileList: FileList, parentUid: string): Promise<void>`

Upload from drag & drop events. Handles folders dropped from file system.

```typescript
const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const { items, files } = e.dataTransfer;
    await uploadManager.uploadDrop(items, files, parentUid);
};
```

#### `cancelUpload(uploadId: string): void`

Cancel an in-progress upload.

```typescript
uploadManager.cancelUpload(uploadId);
```

#### `retryUpload(uploadId: string): void`

Retry a failed upload.

```typescript
uploadManager.retryUpload(uploadId);
```

#### `resolveConflict(uploadId: string, strategy: UploadConflictStrategy, applyToAll?: boolean): Promise<void>`

Resolve upload conflicts (file/folder already exists).

```typescript
await uploadManager.resolveConflict(
    uploadId,
    UploadConflictStrategy.Replace,
    true // apply to all conflicts in batch
);
```

**Strategies:**

- `UploadConflictStrategy.Skip` - Skip the upload
- `UploadConflictStrategy.Replace` - Replace existing file/folder
- `UploadConflictStrategy.Rename` - Rename to avoid conflict (Automatically generate an available name)

#### `clearUploadQueue(): void`

Stop all uploads and clear the queue.

```typescript
uploadManager.clearUploadQueue();
```

#### `onUploadEvent(callback: (event: UploadEvent) => Promise<void>): void`

**ONLY SUPPORT SINGLE SUBSRIPTION FOR NOW** Subscribe to upload events (progress, completion, errors, conflicts).

```typescript
uploadManager.onUploadEvent(async (event) => {
    if (event.type === 'file:complete') {
        console.log('Upload complete:', event.nodeUid);
    }
});
```

**Event Types:**

- `file:started` - Upload started with abort controller
- `file:progress` - Upload progress updated
- `file:complete` - Upload finished successfully
- `file:error` - Upload failed
- `file:conflict` - Name conflict detected
- `folder:complete` - Folder created successfully
- `folder:error` - Folder creation failed
- `folder:conflict` - Folder name conflict detected

## Queue Store

React to queue changes using Zustand store.

```typescript
import { useUploadQueueStore } from '@proton/drive/modules/upload';

function UploadProgress() {
  const queueItems = useUploadQueueStore((state) => Array.from(state.queue.values()));
  const pendingUploads = queueItems.filter(item => item.status === UploadStatus.Pending);

  return <div>{pendingUploads.length} uploads pending</div>;
}
```

### UploadItem

```typescript
type UploadItem = {
    uploadId: string;
    type: NodeType.File | NodeType.Folder;
    name: string;
    parentUid: string;
    status: UploadStatus;
    batchId: string; // Groups uploads from same operation
    lastStatusUpdateTime: Date;

    // File-specific
    file?: File;
    uploadedBytes?: number;
    clearTextExpectedSize?: number;
    speedBytesPerSecond?: number;

    // Conflict resolution
    conflictType?: UploadConflictType;
    resolvedStrategy?: UploadConflictStrategy;
    existingNodeUid?: string;

    // Folder hierarchy
    parentUploadId?: string; // Links child uploads to parent folder upload

    // Error info
    error?: Error;
};
```

### UploadStatus

- `Pending` - Queued, waiting to start
- `InProgress` - Currently uploading
- `Finished` - Completed successfully
- `Failed` - Upload failed
- `Cancelled` - User cancelled
- `ConflictFound` - Name conflict needs resolution
- `Skipped` - Skipped due to conflict resolution
- `PausedServer` - Paused due to server event
- `ParentCancelled` - Parent folder was cancelled

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for internal design details.
