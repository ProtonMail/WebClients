import { CapacityManager } from './CapacityManager';

describe('CapacityManager', () => {
    let capacityManager: CapacityManager;

    beforeEach(() => {
        capacityManager = new CapacityManager();
    });

    describe('getCurrentLoad', () => {
        it('should return empty load initially', () => {
            const load = capacityManager.getCurrentLoad();

            expect(load.activePreparingFiles).toBe(0);
            expect(load.activeUploadingFiles).toBe(0);
            expect(load.activeFolders).toBe(0);
            expect(load.activeBytesTotal).toBe(0);
            expect(load.taskLoads.size).toBe(0);
        });

        it('should return current load with preparing files', () => {
            capacityManager.reservePreparing('task1');
            capacityManager.reservePreparing('task2');

            const load = capacityManager.getCurrentLoad();

            expect(load.activePreparingFiles).toBe(2);
            expect(load.activeUploadingFiles).toBe(0);
        });

        it('should return current load with uploading files', () => {
            capacityManager.reserveUploading('task1', 1000);
            capacityManager.reserveUploading('task2', 2000);

            const load = capacityManager.getCurrentLoad();

            expect(load.activePreparingFiles).toBe(0);
            expect(load.activeUploadingFiles).toBe(2);
            expect(load.activeBytesTotal).toBe(3000);
            expect(load.taskLoads.size).toBe(2);
        });

        it('should return current load with active folders', () => {
            capacityManager.reserveFolder();
            capacityManager.reserveFolder();
            capacityManager.reserveFolder();

            const load = capacityManager.getCurrentLoad();

            expect(load.activeFolders).toBe(3);
        });

        it('should account for uploaded progress in total bytes', () => {
            capacityManager.reserveUploading('task1', 1000);
            capacityManager.updateProgress('task1', 400);

            const load = capacityManager.getCurrentLoad();

            expect(load.activeBytesTotal).toBe(600);
        });
    });

    describe('reservePreparing / releasePreparing', () => {
        it('should increment and decrement preparing count', () => {
            capacityManager.reservePreparing('task1');
            expect(capacityManager.getCurrentLoad().activePreparingFiles).toBe(1);

            capacityManager.releasePreparing('task1');
            expect(capacityManager.getCurrentLoad().activePreparingFiles).toBe(0);
        });

        it('should track multiple preparing files', () => {
            capacityManager.reservePreparing('task1');
            capacityManager.reservePreparing('task2');
            capacityManager.reservePreparing('task3');

            expect(capacityManager.getCurrentLoad().activePreparingFiles).toBe(3);
        });

        it('should be idempotent on double release', () => {
            capacityManager.reservePreparing('task1');
            capacityManager.releasePreparing('task1');
            capacityManager.releasePreparing('task1');

            expect(capacityManager.getCurrentLoad().activePreparingFiles).toBe(0);
        });
    });

    describe('reserveUploading / releaseUploading', () => {
        it('should increment uploading count and track size', () => {
            capacityManager.reserveUploading('task1', 1000);

            const load = capacityManager.getCurrentLoad();
            expect(load.activeUploadingFiles).toBe(1);
            expect(load.activeBytesTotal).toBe(1000);
        });

        it('should decrement uploading count on release', () => {
            capacityManager.reserveUploading('task1', 1000);
            capacityManager.releaseUploading('task1');

            const load = capacityManager.getCurrentLoad();
            expect(load.activeUploadingFiles).toBe(0);
            expect(load.activeBytesTotal).toBe(0);
            expect(load.taskLoads.size).toBe(0);
        });

        it('should only release specified file', () => {
            capacityManager.reserveUploading('task1', 1000);
            capacityManager.reserveUploading('task2', 2000);
            capacityManager.releaseUploading('task1');

            const load = capacityManager.getCurrentLoad();
            expect(load.activeUploadingFiles).toBe(1);
            expect(load.activeBytesTotal).toBe(2000);
        });
    });

    describe('releaseFile', () => {
        it('should safely release a file in preparing phase', () => {
            capacityManager.reservePreparing('task1');
            capacityManager.releaseFile('task1');

            const load = capacityManager.getCurrentLoad();
            expect(load.activePreparingFiles).toBe(0);
            expect(load.activeUploadingFiles).toBe(0);
        });

        it('should safely release a file in uploading phase', () => {
            capacityManager.reserveUploading('task1', 1000);
            capacityManager.releaseFile('task1');

            const load = capacityManager.getCurrentLoad();
            expect(load.activePreparingFiles).toBe(0);
            expect(load.activeUploadingFiles).toBe(0);
            expect(load.activeBytesTotal).toBe(0);
        });

        it('should be idempotent — safe to call even if already released', () => {
            capacityManager.reservePreparing('task1');
            capacityManager.releaseFile('task1');
            capacityManager.releaseFile('task1');

            expect(capacityManager.getCurrentLoad().activePreparingFiles).toBe(0);
        });
    });

    describe('reserveFolder / releaseFolder', () => {
        it('should increment active folders count', () => {
            capacityManager.reserveFolder();

            const load = capacityManager.getCurrentLoad();
            expect(load.activeFolders).toBe(1);
        });

        it('should decrement active folders count', () => {
            capacityManager.reserveFolder();
            capacityManager.releaseFolder();

            const load = capacityManager.getCurrentLoad();
            expect(load.activeFolders).toBe(0);
        });

        it('should handle multiple folder releases', () => {
            capacityManager.reserveFolder();
            capacityManager.reserveFolder();
            capacityManager.reserveFolder();
            capacityManager.releaseFolder();

            const load = capacityManager.getCurrentLoad();
            expect(load.activeFolders).toBe(2);
        });
    });

    describe('updateProgress', () => {
        it('should update uploaded bytes for file', () => {
            capacityManager.reserveUploading('task1', 1000);
            capacityManager.updateProgress('task1', 400);

            const load = capacityManager.getCurrentLoad();
            expect(load.activeBytesTotal).toBe(600);
        });

        it('should handle progress updates for multiple files', () => {
            capacityManager.reserveUploading('task1', 1000);
            capacityManager.reserveUploading('task2', 2000);
            capacityManager.updateProgress('task1', 400);
            capacityManager.updateProgress('task2', 1000);

            const load = capacityManager.getCurrentLoad();
            expect(load.activeBytesTotal).toBe(1600);
        });

        it('should handle progress update for non-existent task', () => {
            capacityManager.updateProgress('nonexistent', 400);

            const load = capacityManager.getCurrentLoad();
            expect(load.activeBytesTotal).toBe(0);
        });

        it('should update progress multiple times for same file', () => {
            capacityManager.reserveUploading('task1', 1000);
            capacityManager.updateProgress('task1', 200);
            capacityManager.updateProgress('task1', 400);
            capacityManager.updateProgress('task1', 800);

            const load = capacityManager.getCurrentLoad();
            expect(load.activeBytesTotal).toBe(200);
        });
    });

    describe('reset', () => {
        it('should reset all counters', () => {
            capacityManager.reservePreparing('task1');
            capacityManager.reserveUploading('task2', 2000);
            capacityManager.reserveFolder();
            capacityManager.reserveFolder();
            capacityManager.reset();

            const load = capacityManager.getCurrentLoad();
            expect(load.activePreparingFiles).toBe(0);
            expect(load.activeUploadingFiles).toBe(0);
            expect(load.activeFolders).toBe(0);
            expect(load.activeBytesTotal).toBe(0);
            expect(load.taskLoads.size).toBe(0);
        });
    });

    describe('preparing → uploading transition', () => {
        it('should correctly transition a file from preparing to uploading', () => {
            capacityManager.reservePreparing('task1');
            expect(capacityManager.getCurrentLoad().activePreparingFiles).toBe(1);
            expect(capacityManager.getCurrentLoad().activeUploadingFiles).toBe(0);

            capacityManager.releasePreparing('task1');
            capacityManager.reserveUploading('task1', 5000);

            const load = capacityManager.getCurrentLoad();
            expect(load.activePreparingFiles).toBe(0);
            expect(load.activeUploadingFiles).toBe(1);
            expect(load.activeBytesTotal).toBe(5000);
        });
    });

    describe('mixed operations', () => {
        it('should handle concurrent preparing, uploading, and folder operations', () => {
            capacityManager.reservePreparing('task1');
            capacityManager.reserveUploading('task2', 2000);
            capacityManager.reserveFolder();
            capacityManager.reserveFolder();

            let load = capacityManager.getCurrentLoad();
            expect(load.activePreparingFiles).toBe(1);
            expect(load.activeUploadingFiles).toBe(1);
            expect(load.activeFolders).toBe(2);
            expect(load.activeBytesTotal).toBe(2000);

            capacityManager.releaseFile('task1');
            capacityManager.releaseFile('task2');
            capacityManager.releaseFolder();

            load = capacityManager.getCurrentLoad();
            expect(load.activePreparingFiles).toBe(0);
            expect(load.activeUploadingFiles).toBe(0);
            expect(load.activeFolders).toBe(1);
            expect(load.activeBytesTotal).toBe(0);
        });
    });
});
