import { NodeType } from '@protontech/drive-sdk';

import { UploadManager } from './UploadManager';
import { useUploadQueueStore } from './store/uploadQueue.store';
import { type FileUploadItem, type PhotosUploadItem, isPhotosUploadItem } from './types';

const createFileWithPath = (name: string, path: string) => {
    const file = new File(['test content'], name);
    Object.defineProperty(file, 'webkitRelativePath', { value: path });
    return file;
};

jest.mock('./orchestration/UploadOrchestrator', () => {
    return {
        UploadOrchestrator: jest.fn().mockImplementation(() => {
            return {
                start: jest.fn().mockResolvedValue(undefined),
                stop: jest.fn(),
                reset: jest.fn(),
                cancel: jest.fn(),
                chooseConflictStrategy: jest.fn(),
                setConflictResolver: jest.fn(),
                removeConflictResolver: jest.fn(),
                subscribeToEvents: jest.fn().mockReturnValue(() => {}),
                hasSubscriptions: jest.fn().mockReturnValue(false),
                setDriveClient: jest.fn(),
                emitFileQueued: jest.fn(),
            };
        }),
    };
});

describe('UploadManager', () => {
    let uploadManager: UploadManager;

    beforeEach(() => {
        uploadManager = new UploadManager();
        useUploadQueueStore.getState().clearQueue();
    });

    afterEach(() => {
        uploadManager.clearUploadQueue();
    });

    describe('upload with mixed files and folders', () => {
        it('should correctly handle standalone files mixed with folder structures', async () => {
            const files = [
                createFileWithPath('standalone1.txt', ''),
                createFileWithPath('standalone2.pdf', ''),
                createFileWithPath('file-in-folder.txt', 'MyFolder/file-in-folder.txt'),
                createFileWithPath('nested-file.js', 'MyFolder/subfolder/nested-file.js'),
            ];

            await uploadManager.upload(files, 'parent-uid-123');

            const queueState = useUploadQueueStore.getState();
            const queueItems = Array.from(queueState.queue.values());

            const folderItems = queueItems.filter((item) => item.type === NodeType.Folder);
            const fileItems = queueItems.filter((item) => item.type === NodeType.File);

            expect(folderItems).toHaveLength(2);
            expect(folderItems.some((item) => item.name === 'MyFolder')).toBe(true);
            expect(folderItems.some((item) => item.name === 'subfolder')).toBe(true);

            expect(fileItems).toHaveLength(4);
            expect(fileItems.some((item) => item.name === 'standalone1.txt')).toBe(true);
            expect(fileItems.some((item) => item.name === 'standalone2.pdf')).toBe(true);
            expect(fileItems.some((item) => item.name === 'file-in-folder.txt')).toBe(true);
            expect(fileItems.some((item) => item.name === 'nested-file.js')).toBe(true);

            const standalone1 = fileItems.find((item) => item.name === 'standalone1.txt') as FileUploadItem;
            expect(standalone1?.parentUid).toBe('parent-uid-123');
            expect(standalone1?.parentUploadId).toBeUndefined();
        });

        it('should not create folders for standalone files', async () => {
            const files = [
                createFileWithPath('file1.txt', ''),
                createFileWithPath('file2.pdf', 'file2.pdf'),
                createFileWithPath('folder-file.txt', 'RealFolder/folder-file.txt'),
            ];

            await uploadManager.upload(files, 'parent-uid-456');

            const queueState = useUploadQueueStore.getState();
            const queueItems = Array.from(queueState.queue.values());

            const folderItems = queueItems.filter((item) => item.type === NodeType.Folder);

            expect(folderItems).toHaveLength(1);
            expect(folderItems[0].name).toBe('RealFolder');

            const fileItems = queueItems.filter((item) => item.type === NodeType.File);
            const standaloneFiles = fileItems.filter(
                (item) => item.name === 'file1.txt' || item.name === 'file2.pdf'
            ) as FileUploadItem[];

            expect(standaloneFiles).toHaveLength(2);
            standaloneFiles.forEach((file) => {
                expect(file.parentUid).toBe('parent-uid-456');
                expect(file.parentUploadId).toBeUndefined();
            });
        });

        it('should handle multiple folders with standalone files', async () => {
            const files = [
                createFileWithPath('root-file.txt', ''),
                createFileWithPath('file1.txt', 'Folder1/file1.txt'),
                createFileWithPath('file2.txt', 'Folder2/file2.txt'),
                createFileWithPath('another-root.pdf', 'another-root.pdf'),
            ];

            await uploadManager.upload(files, 'parent-uid-789');

            const queueState = useUploadQueueStore.getState();
            const queueItems = Array.from(queueState.queue.values());

            const folderItems = queueItems.filter((item) => item.type === NodeType.Folder);
            expect(folderItems).toHaveLength(2);
            expect(folderItems.some((item) => item.name === 'Folder1')).toBe(true);
            expect(folderItems.some((item) => item.name === 'Folder2')).toBe(true);

            const fileItems = queueItems.filter((item) => item.type === NodeType.File);
            expect(fileItems).toHaveLength(4);

            const rootFiles = fileItems.filter(
                (item) => item.name === 'root-file.txt' || item.name === 'another-root.pdf'
            ) as FileUploadItem[];
            expect(rootFiles).toHaveLength(2);
            rootFiles.forEach((file) => {
                expect(file.parentUid).toBe('parent-uid-789');
                expect(file.parentUploadId).toBeUndefined();
            });
        });
    });

    describe('uploadPhotos', () => {
        it('should treat all files as flat even when they have folder structure', async () => {
            const files = [
                createFileWithPath('photo1.jpg', ''),
                createFileWithPath('photo2.jpg', 'MyFolder/photo2.jpg'),
                createFileWithPath('photo3.jpg', 'Vacation/2024/photo3.jpg'),
            ];

            await uploadManager.uploadPhotos(files);

            const queueState = useUploadQueueStore.getState();
            const queueItems = Array.from(queueState.queue.values());

            const folderItems = queueItems.filter((item) => item.type === NodeType.Folder);
            expect(folderItems).toHaveLength(0);

            const fileItems = queueItems.filter((item) => item.type === NodeType.File);
            expect(fileItems).toHaveLength(3);

            fileItems.forEach((item) => {
                expect(isPhotosUploadItem(item)).toBe(true);
                const file = item as PhotosUploadItem;
                expect(file.isForPhotos).toBe(true);
                expect(file.parentUploadId).toBeUndefined();
            });
        });

        it('should ignore folder structure and upload photos as flat files', async () => {
            const files = [
                createFileWithPath('img1.png', 'Folder1/Subfolder/img1.png'),
                createFileWithPath('img2.png', 'Folder2/img2.png'),
            ];

            await uploadManager.uploadPhotos(files);

            const queueState = useUploadQueueStore.getState();
            const queueItems = Array.from(queueState.queue.values());

            expect(queueItems).toHaveLength(2);
            expect(queueItems.every((item) => item.type === NodeType.File)).toBe(true);
            expect(queueItems.every((item) => isPhotosUploadItem(item))).toBe(true);
        });
    });
});
