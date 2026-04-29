import type {
    NodeType,
    NodeWithSameNameExistsValidationError,
    ProtonDriveClient,
    UploadController,
} from '@protontech/drive-sdk';
import type { ProtonDrivePhotosClient } from '@protontech/drive-sdk/dist/protonDrivePhotosClient';
import type { ProtonDrivePublicLinkClient } from '@protontech/drive-sdk/dist/protonDrivePublicLinkClient';

export type FileUploadEvent =
    | { type: 'file:queued'; uploadId: string; isForPhotos: boolean; abortController: AbortController }
    | { type: 'file:preparing'; uploadId: string; isForPhotos: boolean }
    | { type: 'file:prepared'; uploadId: string; isForPhotos: boolean }
    | {
          type: 'file:started';
          uploadId: string;
          controller: UploadController;
          isForPhotos: boolean;
      }
    | { type: 'file:progress'; uploadId: string; uploadedBytes: number; isForPhotos: boolean }
    | {
          type: 'file:complete';
          uploadId: string;
          nodeUid: string;
          parentUid: string | undefined;
          isUpdatedNode: boolean | undefined;
          isForPhotos: boolean;
      }
    | { type: 'file:error'; uploadId: string; error: Error; isForPhotos: boolean }
    | {
          type: 'file:conflict';
          uploadId: string;
          error: NodeWithSameNameExistsValidationError;
          isForPhotos: boolean;
      }
    | { type: 'file:cancelled'; uploadId: string; isForPhotos: boolean };

export type FolderCreationEvent =
    | { type: 'folder:complete'; uploadId: string; nodeUid: string; parentUid: string | undefined }
    | { type: 'folder:error'; uploadId: string; error: Error }
    | { type: 'folder:conflict'; uploadId: string; error: NodeWithSameNameExistsValidationError }
    | { type: 'folder:cancelled'; uploadId: string };

export type PhotosUploadEvent =
    | { type: 'photo:exist'; uploadId: string; duplicateUids: string[] }
    | { type: 'photo:unsupported'; uploadId: string };

export type UploadEvent = FileUploadEvent | FolderCreationEvent | PhotosUploadEvent;

type BaseFileUploadTask = {
    uploadId: string;
    type: NodeType.File | NodeType.Photo;
    name: string;
    batchId: string;
    file: File;
    sizeEstimate: number;
    existingNodeUid?: string;
    isUnfinishedUpload?: boolean;
};

export type FileUploadTask = BaseFileUploadTask & {
    type: NodeType.File;
    parentUid: string;
    isForPhotos?: false;
};

export type PhotosUploadTask = BaseFileUploadTask & {
    type: NodeType.Photo;
    isForPhotos: true;
};

export type FolderCreationTask = {
    uploadId: string;
    type: NodeType.Folder;
    name: string;
    parentUid: string;
    batchId: string;
    modificationTime?: Date;
};

export type UploadTask = FileUploadTask | PhotosUploadTask | FolderCreationTask;

export type ExecutionResult = {
    success: boolean;
    uploadId: string;
    nodeUid?: string;
    error?: Error;
    needsConflictResolution?: boolean;
    conflictError?: NodeWithSameNameExistsValidationError;
    controller?: UploadController;
    abortController?: AbortController;
};

export type SchedulerLoad = {
    activePreparingFiles: number;
    activeUploadingFiles: number;
    activeFolders: number;
    activeBytesTotal: number;
    taskLoads: Map<string, { totalBytes: number; uploadedBytes: number }>;
};

export enum BaseTransferStatus {
    InProgress = 'inProgress',
    Failed = 'failed',
    Paused = 'paused',
    PausedServer = 'pausedServer',
    Finished = 'finished',
    Pending = 'pending',
    Cancelled = 'cancelled',
}

export enum UploadConflictStrategy {
    Rename = 'rename',
    Replace = 'replace',
    Skip = 'skip',
}

export enum UploadConflictType {
    Draft = 'draft',
    Normal = 'normal',
}

export enum UploadStatus {
    Pending = BaseTransferStatus.Pending,
    Preparing = 'preparing',
    Waiting = 'waiting',
    InProgress = BaseTransferStatus.InProgress,
    Finished = BaseTransferStatus.Finished,
    Failed = BaseTransferStatus.Failed,
    Cancelled = BaseTransferStatus.Cancelled,
    ParentCancelled = 'parentCancelled',
    Skipped = 'skipped',
    ConflictFound = 'conflictFound',
    PausedServer = BaseTransferStatus.PausedServer,
    PhotosDuplicate = 'photosDuplicate',
    NotSupportedForPhotos = 'notSupportedForPhotos',
}

export type BaseUploadItem = {
    uploadId: string;
    name: string;
    status: UploadStatus;
    batchId: string;
    error?: Error;
    nodeUid?: string;
    lastStatusUpdateTime: Date;
    resolvedStrategy?: UploadConflictStrategy;
};

type BaseFileUploadItem = BaseUploadItem & {
    type: NodeType.File | NodeType.Photo;
    file: File;
    parentUploadId?: string;
    uploadedBytes: number;
    clearTextExpectedSize: number;
    thumbnailUrl?: string;
    speedBytesPerSecond?: number;
    existingNodeUid?: string;
    isUnfinishedUpload?: boolean;
};

export type FileUploadItem = BaseFileUploadItem & {
    type: NodeType.File;
    parentUid: string;
};

export type PhotosUploadItem = BaseFileUploadItem & {
    type: NodeType.Photo;
    isForPhotos: true;
};

export type FolderCreationItem = BaseUploadItem & {
    type: NodeType.Folder;
    parentUid: string;
    parentUploadId?: string;
    modificationTime?: Date;
};

export type UploadItem = FileUploadItem | FolderCreationItem | PhotosUploadItem;

export type FileUploadItems = FileUploadItem | PhotosUploadItem;

export function isPhotosUploadItem(item: UploadItem): item is PhotosUploadItem {
    return 'isForPhotos' in item && item.isForPhotos === true;
}

export type DriveUploadClient = ProtonDriveClient | ProtonDrivePublicLinkClient | ProtonDrivePhotosClient;

export type EventCallback = (event: UploadEvent) => Promise<void>;

export type UploadEventSubscriberCallback = (event: UploadEvent, driveClient: DriveUploadClient) => Promise<void>;
