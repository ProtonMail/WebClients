# Upload Manager

SDK-based upload system for Proton Drive. Handles file and folder uploads with conflict resolution, progress tracking, and queue management.

## Quick Start

```typescript
import { UploadConflictStrategy, uploadManager, useUploadQueueStore } from '@proton/drive/modules/upload';

// Upload files to Drive
await uploadManager.upload(files, parentNodeUid);

// Upload photos (no parent needed)
await uploadManager.uploadPhotos(files);

// Upload from drag & drop (supports folders)
await uploadManager.upload(event.dataTransfer, parentNodeUid);

// Upload photos from drag & drop
await uploadManager.uploadPhotos(event.dataTransfer);

// Monitor upload queue
const queue = useUploadQueueStore((state) => state.queue);
```

## API

### uploadManager

Global singleton instance. Provides the main upload interface.

#### `upload(files: File[] | FileList | DataTransferItemList, parentUid: string, fallbackFileList?: FileList): Promise<void>`

Upload files or folders to a parent node in Drive. Automatically detects folder structures from `webkitRelativePath`.

**Parameters:**

- `files` - Files from file input, or DataTransferfrom drag & drop
- `parentUid` - Parent node UID where files will be uploaded
- `fallbackFileList` - Optional FileList for browser compatibility with drag & drop

```typescript
// From file input
await uploadManager.upload(fileInput.files, parentNodeUid);

// From drag & drop
const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    await uploadManager.upload(e.dataTransfer, parentUid);
};
```

#### `uploadPhotos(files: File[] | FileList | DataTransfer): Promise<void>`

Upload photos (no parent node required). Photos uploads are flat - no folder structure.

**Parameters:**

- `files` - Files from file input, or DataTransfer from drag & drop

```typescript
// From file input
await uploadManager.uploadPhotos(fileInput.files);

// From drag & drop
const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    await uploadManager.uploadPhotos(e.dataTransfer, files);
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
- `PhotosDuplicate` - Skipped when same photos (content is the same) was found

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for internal design details.
