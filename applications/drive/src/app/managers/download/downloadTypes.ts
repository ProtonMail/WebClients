import type { NodeEntity } from '@proton/drive';

import type { DownloadController } from './DownloadManager';

export type ArchiveStreamGeneratorResult = {
    generator: AsyncGenerator<ArchiveItem>;
    controller: DownloadController;
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

export type DownloadQueueTaskHandle = {
    completion: Promise<void>;
};

export type DownloadQueueTask = {
    taskId: string;
    node: NodeEntity;
    downloadId: string;
    storageSizeEstimate?: number;
    start: () => Promise<DownloadQueueTaskHandle>;
};

export type DownloadScheduler = {
    scheduleDownload(task: DownloadQueueTask): string;
    cancelTask(taskId: string): void;
    cancelDownloadsById(downloadId: string): void;
    clearDownloads(): void;
    generateTaskId(): string;
    updateDownloadProgress(taskId: string, downloadedBytes: number): void;
};
