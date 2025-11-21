import type { NodeType, NodeWithSameNameExistsValidationError, UploadController } from '@protontech/drive-sdk';

export type FileUploadEvent =
    | { type: 'file:started'; uploadId: string; controller: UploadController; abortController: AbortController }
    | { type: 'file:progress'; uploadId: string; uploadedBytes: number }
    | {
          type: 'file:complete';
          uploadId: string;
          nodeUid: string;
          parentUid: string | undefined;
          isUpdatedNode: boolean | undefined;
      }
    | { type: 'file:error'; uploadId: string; error: Error }
    | { type: 'file:conflict'; uploadId: string; error: NodeWithSameNameExistsValidationError };

export type FolderCreationEvent =
    | { type: 'folder:complete'; uploadId: string; nodeUid: string; parentUid: string | undefined }
    | { type: 'folder:error'; uploadId: string; error: Error }
    | { type: 'folder:conflict'; uploadId: string; error: NodeWithSameNameExistsValidationError };

export type UploadEvent = FileUploadEvent | FolderCreationEvent;

export type UploadTask =
    | {
          uploadId: string;
          type: NodeType.File;
          name: string;
          parentUid: string;
          batchId: string;
          file: File;
          sizeEstimate: number;
          existingNodeUid?: string;
          isUnfinishedUpload?: boolean;
      }
    | {
          uploadId: string;
          type: NodeType.Folder;
          name: string;
          parentUid: string;
          batchId: string;
          modificationTime?: Date;
      };

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
    activeFiles: number;
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
    InProgress = BaseTransferStatus.InProgress,
    Finished = BaseTransferStatus.Finished,
    Failed = BaseTransferStatus.Failed,
    Cancelled = BaseTransferStatus.Cancelled,
    ParentCancelled = 'parentCancelled',
    Skipped = 'skipped',
    ConflictFound = 'conflictFound',
    PausedServer = BaseTransferStatus.PausedServer,
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

export type FileUploadItem = BaseUploadItem & {
    type: NodeType.File;
    file: File;
    parentUid: string;
    parentUploadId?: string;
    uploadedBytes: number;
    clearTextExpectedSize: number;
    thumbnailUrl?: string;
    speedBytesPerSecond?: number;
    existingNodeUid?: string;
    isUnfinishedUpload?: boolean;
};

export type FolderCreationItem = BaseUploadItem & {
    type: NodeType.Folder;
    parentUid: string;
    parentUploadId?: string;
    modificationTime?: Date;
};

export type UploadItem = FileUploadItem | FolderCreationItem;

export type EventCallback = (event: UploadEvent) => void;

export interface ExtendedAttributesMetadata {
    Media?: {
        Width?: number;
        Height?: number;
        Duration?: number;
    };
}
