import { NodeType } from '@protontech/drive-sdk';

import { UploadStatus } from '../types';
import { getNextTasks } from './schedulerHelpers';

describe('schedulerHelpers', () => {
    describe('getNextTasks', () => {
        it('should return empty array when no pending items', () => {
            const result = getNextTasks(
                [],
                {
                    activePreparingFiles: 0,
                    activeUploadingFiles: 0,
                    activeFolders: 0,
                    activeBytesTotal: 0,
                    taskLoads: new Map(),
                },
                5,
                3
            );
            expect(result).toEqual([]);
        });

        it('should return folder tasks when available', () => {
            const queueItems = [
                {
                    uploadId: 'folder-1',
                    type: NodeType.Folder,
                    status: UploadStatus.Pending,
                    name: 'test-folder',
                    parentUid: 'root',
                    batchId: 'batch-1',
                    modificationTime: new Date(),
                    lastStatusUpdateTime: new Date(),
                },
            ] as any;
            const result = getNextTasks(
                queueItems,
                {
                    activePreparingFiles: 0,
                    activeUploadingFiles: 0,
                    activeFolders: 0,
                    activeBytesTotal: 0,
                    taskLoads: new Map(),
                },
                5,
                3
            );
            expect(result).toHaveLength(1);
            expect(result[0].type).toBe(NodeType.Folder);
            expect(result[0].uploadId).toBe('folder-1');
        });

        it('should return file tasks when available', () => {
            const queueItems = [
                {
                    uploadId: 'file-1',
                    type: NodeType.File,
                    status: UploadStatus.Pending,
                    name: 'test.txt',
                    parentUid: 'root',
                    batchId: 'batch-1',
                    file: {} as File,
                    clearTextExpectedSize: 1000,
                    uploadedBytes: 0,
                    lastStatusUpdateTime: new Date(),
                },
            ] as any;
            const result = getNextTasks(
                queueItems,
                {
                    activePreparingFiles: 0,
                    activeUploadingFiles: 0,
                    activeFolders: 0,
                    activeBytesTotal: 0,
                    taskLoads: new Map(),
                },
                5,
                3
            );
            expect(result).toHaveLength(1);
            expect(result[0].type).toBe(NodeType.File);
            expect(result[0].uploadId).toBe('file-1');
        });

        it('should respect folder capacity limits', () => {
            const queueItems = [
                {
                    uploadId: 'folder-1',
                    type: NodeType.Folder,
                    status: UploadStatus.Pending,
                    name: 'f1',
                    parentUid: 'root',
                    batchId: 'b1',
                    modificationTime: new Date(),
                    lastStatusUpdateTime: new Date(),
                },
                {
                    uploadId: 'folder-2',
                    type: NodeType.Folder,
                    status: UploadStatus.Pending,
                    name: 'f2',
                    parentUid: 'root',
                    batchId: 'b1',
                    modificationTime: new Date(),
                    lastStatusUpdateTime: new Date(),
                },
            ] as any;
            const result = getNextTasks(
                queueItems,
                {
                    activePreparingFiles: 0,
                    activeUploadingFiles: 0,
                    activeFolders: 1,
                    activeBytesTotal: 0,
                    taskLoads: new Map(),
                },
                5,
                2
            );
            expect(result).toHaveLength(1);
        });

        it('should respect file capacity limits', () => {
            const queueItems = [
                {
                    uploadId: 'file-1',
                    type: NodeType.File,
                    status: UploadStatus.Pending,
                    name: 't1.txt',
                    parentUid: 'root',
                    batchId: 'b1',
                    file: {} as File,
                    clearTextExpectedSize: 100,
                    uploadedBytes: 0,
                    lastStatusUpdateTime: new Date(),
                },
                {
                    uploadId: 'file-2',
                    type: NodeType.File,
                    status: UploadStatus.Pending,
                    name: 't2.txt',
                    parentUid: 'root',
                    batchId: 'b1',
                    file: {} as File,
                    clearTextExpectedSize: 100,
                    uploadedBytes: 0,
                    lastStatusUpdateTime: new Date(),
                },
            ] as any;
            const result = getNextTasks(
                queueItems,
                {
                    activePreparingFiles: 4,
                    activeUploadingFiles: 0,
                    activeFolders: 0,
                    activeBytesTotal: 0,
                    taskLoads: new Map(),
                },
                5,
                3
            );
            expect(result).toHaveLength(1);
        });

        it('should skip items with unready parents', () => {
            const queueItems = [
                {
                    uploadId: 'folder-1',
                    type: NodeType.Folder,
                    status: UploadStatus.Pending,
                    name: 'parent',
                    parentUid: 'root',
                    batchId: 'b1',
                    modificationTime: new Date(),
                    nodeUid: undefined,
                    lastStatusUpdateTime: new Date(),
                },
                {
                    uploadId: 'file-1',
                    type: NodeType.File,
                    status: UploadStatus.Pending,
                    name: 't.txt',
                    parentUid: 'root',
                    parentUploadId: 'folder-1',
                    batchId: 'b1',
                    file: {} as File,
                    clearTextExpectedSize: 100,
                    uploadedBytes: 0,
                    lastStatusUpdateTime: new Date(),
                },
            ] as any;
            const result = getNextTasks(
                queueItems,
                {
                    activePreparingFiles: 0,
                    activeUploadingFiles: 0,
                    activeFolders: 0,
                    activeBytesTotal: 0,
                    taskLoads: new Map(),
                },
                5,
                3
            );
            expect(result).toHaveLength(1);
            expect(result[0].uploadId).toBe('folder-1');
        });

        it('should sort folders by depth', () => {
            const queueItems = [
                {
                    uploadId: 'child',
                    type: NodeType.Folder,
                    status: UploadStatus.Pending,
                    name: 'child',
                    parentUid: 'root',
                    parentUploadId: 'parent',
                    batchId: 'b1',
                    modificationTime: new Date(),
                    lastStatusUpdateTime: new Date(),
                },
                {
                    uploadId: 'parent',
                    type: NodeType.Folder,
                    status: UploadStatus.Pending,
                    name: 'parent',
                    parentUid: 'root',
                    batchId: 'b1',
                    modificationTime: new Date(),
                    nodeUid: 'parent-node',
                    lastStatusUpdateTime: new Date(),
                },
            ] as any;
            const result = getNextTasks(
                queueItems,
                {
                    activePreparingFiles: 0,
                    activeUploadingFiles: 0,
                    activeFolders: 0,
                    activeBytesTotal: 0,
                    taskLoads: new Map(),
                },
                5,
                3
            );
            expect(result[0].uploadId).toBe('parent');
            expect(result[1].uploadId).toBe('child');
        });
    });
});
