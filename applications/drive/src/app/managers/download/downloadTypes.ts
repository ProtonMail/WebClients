import type { NodeEntity } from '@proton/drive';

import type { DownloadController } from './DownloadManager';

export type ArchiveStreamGeneratorResult = {
    generator: AsyncGenerator<ArchiveItem>;
    controller: DownloadController;
};

export type ArchiveTracker = {
    readonly lastError?: unknown;
    recordError(error: unknown): void;
    registerFile(taskId: string): void;
    updateDownloadProgress(taskId: string, downloadedBytes: number, claimedSize: number): void;
    attachController(taskId: string, controller: DownloadController): void;
    waitForTaskCompletion(taskId: string): Promise<void>;
    pauseAll(): void;
    resumeAll(): void;
    waitForCompletion(): Promise<void>;
    notifyItemReady(): void;
    notifyError(error: unknown): void;
    waitForFirstItem(): Promise<void>;
};

export type ArchiveItem =
    | {
          isFile: false;
          name: string;
          parentPath: string[];
      }
    | {
          isFile: true;
          name: string;
          parentPath: string[];
          stream: ReadableStream<Uint8Array<ArrayBuffer>>;
          fileModifyTime?: number;
          claimedSize?: number;
      };

export type DownloadQueueTask = {
    taskId: string;
    node: NodeEntity;
    downloadId: string;
    storageSizeEstimate?: number;
    start: () => Promise<void>;
};

export type DownloadScheduler = {
    scheduleDownload(task: DownloadQueueTask): string;
    cancelTask(taskId: string): void;
    cancelDownloadsById(downloadId: string): void;
    clearDownloads(): void;
    generateTaskId(): string;
    updateDownloadProgress(taskId: string, downloadedBytes: number): void;
};

export type DownloadOptions = {
    isPhoto?: boolean;
    albumName?: string;
    shouldScanForMalware?: boolean;
    skipSignatureCheck?: boolean;
    revisionUid?: string;
};
