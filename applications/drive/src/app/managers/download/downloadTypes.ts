import type { DownloadController } from './DownloadManager';

export type DownloadableItem = {
    uid: string;
    name: string;
    isFile: boolean;
    storageSize?: number;
    fileModifyTime?: number;
    parentPath?: string[];
};
export type ArchiveDownloadTask = {
    uid: string;
    storageSize?: number;
    isFile: boolean;
    start: () => Promise<ArchiveItem>;
};

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
      };

export type DownloadQueueTaskHandle = {
    completion: Promise<void>;
};

export type DownloadQueueTask = {
    nodes: DownloadableItem[];
    storageSizeEstimate?: number;
    start: () => Promise<DownloadQueueTaskHandle>;
};

export type DownloadScheduler = {
    scheduleDownload(task: DownloadQueueTask): string;
    cancelDownload(taskId: string): void;
    clearDownloads(): void;
};
