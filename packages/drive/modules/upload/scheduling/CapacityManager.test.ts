import { CapacityManager } from './CapacityManager';

describe('CapacityManager', () => {
    let capacityManager: CapacityManager;

    beforeEach(() => {
        capacityManager = new CapacityManager();
    });

    describe('getCurrentLoad', () => {
        it('should return empty load initially', () => {
            const load = capacityManager.getCurrentLoad();

            expect(load.activeFiles).toBe(0);
            expect(load.activeFolders).toBe(0);
            expect(load.activeBytesTotal).toBe(0);
            expect(load.taskLoads.size).toBe(0);
        });

        it('should return current load with active files', () => {
            capacityManager.reserveFile('task1', 1000);
            capacityManager.reserveFile('task2', 2000);

            const load = capacityManager.getCurrentLoad();

            expect(load.activeFiles).toBe(2);
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
            capacityManager.reserveFile('task1', 1000);
            capacityManager.updateProgress('task1', 400);

            const load = capacityManager.getCurrentLoad();

            expect(load.activeBytesTotal).toBe(600);
        });
    });

    describe('reserveFile', () => {
        it('should increment active files count', () => {
            capacityManager.reserveFile('task1', 1000);

            const load = capacityManager.getCurrentLoad();
            expect(load.activeFiles).toBe(1);
        });

        it('should track file size', () => {
            capacityManager.reserveFile('task1', 1000);

            const load = capacityManager.getCurrentLoad();
            expect(load.activeBytesTotal).toBe(1000);
        });

        it('should track multiple files', () => {
            capacityManager.reserveFile('task1', 1000);
            capacityManager.reserveFile('task2', 2000);
            capacityManager.reserveFile('task3', 3000);

            const load = capacityManager.getCurrentLoad();
            expect(load.activeFiles).toBe(3);
            expect(load.activeBytesTotal).toBe(6000);
        });
    });

    describe('reserveFolder', () => {
        it('should increment active folders count', () => {
            capacityManager.reserveFolder();

            const load = capacityManager.getCurrentLoad();
            expect(load.activeFolders).toBe(1);
        });

        it('should track multiple folders', () => {
            capacityManager.reserveFolder();
            capacityManager.reserveFolder();
            capacityManager.reserveFolder();

            const load = capacityManager.getCurrentLoad();
            expect(load.activeFolders).toBe(3);
        });
    });

    describe('releaseFile', () => {
        it('should decrement active files count', () => {
            capacityManager.reserveFile('task1', 1000);
            capacityManager.releaseFile('task1');

            const load = capacityManager.getCurrentLoad();
            expect(load.activeFiles).toBe(0);
        });

        it('should remove file load tracking', () => {
            capacityManager.reserveFile('task1', 1000);
            capacityManager.releaseFile('task1');

            const load = capacityManager.getCurrentLoad();
            expect(load.activeBytesTotal).toBe(0);
            expect(load.taskLoads.size).toBe(0);
        });

        it('should only release specified file', () => {
            capacityManager.reserveFile('task1', 1000);
            capacityManager.reserveFile('task2', 2000);
            capacityManager.releaseFile('task1');

            const load = capacityManager.getCurrentLoad();
            expect(load.activeFiles).toBe(1);
            expect(load.activeBytesTotal).toBe(2000);
        });
    });

    describe('releaseFolder', () => {
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
            capacityManager.reserveFile('task1', 1000);
            capacityManager.updateProgress('task1', 400);

            const load = capacityManager.getCurrentLoad();
            expect(load.activeBytesTotal).toBe(600);
        });

        it('should handle progress updates for multiple files', () => {
            capacityManager.reserveFile('task1', 1000);
            capacityManager.reserveFile('task2', 2000);
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
            capacityManager.reserveFile('task1', 1000);
            capacityManager.updateProgress('task1', 200);
            capacityManager.updateProgress('task1', 400);
            capacityManager.updateProgress('task1', 800);

            const load = capacityManager.getCurrentLoad();
            expect(load.activeBytesTotal).toBe(200);
        });
    });

    describe('reset', () => {
        it('should reset all counters', () => {
            capacityManager.reserveFile('task1', 1000);
            capacityManager.reserveFile('task2', 2000);
            capacityManager.reserveFolder();
            capacityManager.reserveFolder();
            capacityManager.reset();

            const load = capacityManager.getCurrentLoad();
            expect(load.activeFiles).toBe(0);
            expect(load.activeFolders).toBe(0);
            expect(load.activeBytesTotal).toBe(0);
            expect(load.taskLoads.size).toBe(0);
        });
    });

    describe('mixed operations', () => {
        it('should handle concurrent file and folder operations', () => {
            capacityManager.reserveFile('task1', 1000);
            capacityManager.reserveFolder();
            capacityManager.reserveFile('task2', 2000);
            capacityManager.reserveFolder();

            let load = capacityManager.getCurrentLoad();
            expect(load.activeFiles).toBe(2);
            expect(load.activeFolders).toBe(2);
            expect(load.activeBytesTotal).toBe(3000);

            capacityManager.releaseFile('task1');
            capacityManager.releaseFolder();

            load = capacityManager.getCurrentLoad();
            expect(load.activeFiles).toBe(1);
            expect(load.activeFolders).toBe(1);
            expect(load.activeBytesTotal).toBe(2000);
        });
    });
});
