import { UploadManager } from './UploadManager';

export const uploadManager = new UploadManager();

export { useUploadQueueStore } from './store/uploadQueue.store';

export type { UploadItem } from './types';
export { EmptyFileDecision, UploadConflictStrategy, UploadConflictType, UploadStatus } from './types';
