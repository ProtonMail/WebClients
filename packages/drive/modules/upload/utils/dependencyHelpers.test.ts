import { NodeType } from '@protontech/drive-sdk';

import { UploadStatus } from '../types';
import {
    buildItemsById,
    getAllDescendants,
    getBlockedDescendants,
    getDirectChildren,
    getFolderDepth,
    isParentReady,
} from './dependencyHelpers';

describe('dependencyHelpers', () => {
    describe('isParentReady', () => {
        it('should return true when no parent in queue', () => {
            const item = { parentUid: 'parent-1', type: NodeType.File, status: UploadStatus.Pending } as any;
            const result = isParentReady(item, buildItemsById([]));
            expect(result).toBe(true);
        });

        it('should return true when parent folder has nodeUid', () => {
            const item = { parentUploadId: 'folder-1', type: NodeType.File } as any;
            const allItems = [{ uploadId: 'folder-1', type: NodeType.Folder, nodeUid: 'node-123' }] as any;
            const result = isParentReady(item, buildItemsById(allItems));
            expect(result).toBe(true);
        });

        it('should return false when parent folder has no nodeUid', () => {
            const item = { parentUploadId: 'folder-1', type: NodeType.File } as any;
            const allItems = [{ uploadId: 'folder-1', type: NodeType.Folder, nodeUid: undefined }] as any;
            const result = isParentReady(item, buildItemsById(allItems));
            expect(result).toBe(false);
        });

        it('should return true when parent is finished', () => {
            const item = { parentUploadId: 'folder-1', type: NodeType.File } as any;
            const allItems = [
                {
                    uploadId: 'folder-1',
                    type: NodeType.Folder,
                    nodeUid: 'node-123',
                    status: UploadStatus.Finished,
                },
            ] as any;
            const result = isParentReady(item, buildItemsById(allItems));
            expect(result).toBe(true);
        });
    });

    describe('getFolderDepth', () => {
        it('should return 0 for root level folder', () => {
            const folder = { parentUid: 'root', type: NodeType.Folder } as any;
            const result = getFolderDepth(folder, buildItemsById([]));
            expect(result).toBe(0);
        });

        it('should return 1 for folder with one parent', () => {
            const folder = { parentUploadId: 'parent', type: NodeType.Folder } as any;
            const allItems = [
                { uploadId: 'parent', type: NodeType.Folder, nodeUid: 'parent-node', parentUid: 'root' },
            ] as any;
            const result = getFolderDepth(folder, buildItemsById(allItems));
            expect(result).toBe(1);
        });

        it('should return 2 for nested folder', () => {
            const folder = { parentUploadId: 'child', type: NodeType.Folder } as any;
            const allItems = [
                { uploadId: 'parent', type: NodeType.Folder, nodeUid: 'parent-node', parentUid: 'root' },
                { uploadId: 'child', type: NodeType.Folder, nodeUid: 'child-node', parentUploadId: 'parent' },
            ] as any;
            const result = getFolderDepth(folder, buildItemsById(allItems));
            expect(result).toBe(2);
        });
    });

    describe('getDirectChildren', () => {
        it('should return empty array when no children', () => {
            const result = getDirectChildren('folder-1', []);
            expect(result).toEqual([]);
        });

        it('should find children by parentUploadId', () => {
            const allItems = [
                { uploadId: 'child-1', parentUploadId: 'folder-1' },
                { uploadId: 'child-2', parentUploadId: 'folder-1' },
                { uploadId: 'other', parentUploadId: 'other-folder' },
            ] as any;
            const result = getDirectChildren('folder-1', allItems);
            expect(result).toEqual(['child-1', 'child-2']);
        });

        it('should find children by parentUploadId only', () => {
            const allItems = [
                { uploadId: 'child-1', parentUploadId: 'folder-1' },
                { uploadId: 'child-2', parentUploadId: 'folder-1' },
            ] as any;
            const result = getDirectChildren('folder-1', allItems);
            expect(result).toEqual(['child-1', 'child-2']);
        });

        it('should not find children without matching parentUploadId', () => {
            const allItems = [
                { uploadId: 'child-1', parentUploadId: 'other-folder' },
                { uploadId: 'child-2', parentUploadId: 'another-folder' },
            ] as any;
            const result = getDirectChildren('folder-1', allItems);
            expect(result).toEqual([]);
        });
    });

    describe('getAllDescendants', () => {
        it('should return empty array when no children', () => {
            expect(getAllDescendants(['folder-1'], [])).toEqual([]);
        });

        it('should find nested children of any depth', () => {
            const allItems = [
                { uploadId: 'subfolder', parentUploadId: 'folder-1' },
                { uploadId: 'file-in-subfolder', parentUploadId: 'subfolder' },
                { uploadId: 'file-in-folder', parentUploadId: 'folder-1' },
                { uploadId: 'other', parentUploadId: 'other-folder' },
            ] as any;
            const result = getAllDescendants(['folder-1'], allItems);
            expect(result).toEqual(['subfolder', 'file-in-folder', 'file-in-subfolder']);
        });

        it('should not return the given uploads themselves', () => {
            const allItems = [
                { uploadId: 'folder-1' },
                { uploadId: 'subfolder', parentUploadId: 'folder-1' },
                { uploadId: 'file', parentUploadId: 'subfolder' },
            ] as any;
            const result = getAllDescendants(['folder-1', 'subfolder'], allItems);
            expect(result).toEqual(['file']);
        });
    });

    describe('getBlockedDescendants', () => {
        it('should keep descendants that can still be blocked', () => {
            const allItems = [
                { uploadId: 'folder-1', status: UploadStatus.InProgress },
                { uploadId: 'pending-file', parentUploadId: 'folder-1', status: UploadStatus.Pending },
                { uploadId: 'waiting-file', parentUploadId: 'folder-1', status: UploadStatus.Waiting },
                { uploadId: 'conflicting-file', parentUploadId: 'folder-1', status: UploadStatus.ConflictFound },
            ] as any;
            const result = getBlockedDescendants(['folder-1'], allItems);
            expect(result).toEqual(['pending-file', 'waiting-file', 'conflicting-file']);
        });

        it('should leave descendants in a terminal status alone', () => {
            const allItems = [
                { uploadId: 'folder-1', status: UploadStatus.InProgress },
                { uploadId: 'finished-file', parentUploadId: 'folder-1', status: UploadStatus.Finished },
                { uploadId: 'failed-file', parentUploadId: 'folder-1', status: UploadStatus.Failed },
                { uploadId: 'skipped-file', parentUploadId: 'folder-1', status: UploadStatus.Skipped },
                { uploadId: 'pending-file', parentUploadId: 'folder-1', status: UploadStatus.Pending },
            ] as any;
            const result = getBlockedDescendants(['folder-1'], allItems);
            expect(result).toEqual(['pending-file']);
        });

        it('should still reach pending items under a finished sub-folder', () => {
            const allItems = [
                { uploadId: 'folder-1', status: UploadStatus.InProgress },
                { uploadId: 'finished-subfolder', parentUploadId: 'folder-1', status: UploadStatus.Finished },
                { uploadId: 'pending-file', parentUploadId: 'finished-subfolder', status: UploadStatus.Pending },
            ] as any;
            const result = getBlockedDescendants(['folder-1'], allItems);
            expect(result).toEqual(['pending-file']);
        });
    });
});
