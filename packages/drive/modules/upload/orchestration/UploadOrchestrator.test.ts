import { NodeType } from '../../../index';
import { UploadDriveClientRegistry } from '../UploadDriveClientRegistry';
import { FileUploadExecutor } from '../execution/FileUploadExecutor';
import { FolderCreationExecutor } from '../execution/FolderCreationExecutor';
import { CapacityManager } from '../scheduling/CapacityManager';
import { useUploadQueueStore } from '../store/uploadQueue.store';
import { UploadConflictStrategy, UploadStatus } from '../types';
import { getNextTasks } from '../utils/schedulerHelpers';
import { ConflictManager } from './ConflictManager';
import { SDKTransferActivity } from './SDKTransferActivity';
import { UploadEventHandler } from './UploadEventHandler';
import { UploadOrchestrator } from './UploadOrchestrator';

jest.mock('../store/uploadQueue.store');
jest.mock('../execution/FileUploadExecutor');
jest.mock('../execution/FolderCreationExecutor');
jest.mock('./ConflictManager');
jest.mock('./SDKTransferActivity');
jest.mock('./UploadEventHandler');
jest.mock('../utils/schedulerHelpers');
jest.mock('../scheduling/CapacityManager');
jest.mock('../UploadDriveClientRegistry');

describe('UploadOrchestrator', () => {
    let orchestrator: UploadOrchestrator;
    let mockGetQueue: jest.Mock;
    let mockGetItem: jest.Mock;
    let mockUpdateQueueItems: jest.Mock;
    let mockGetNextTasks: jest.Mock;
    let mockGetCurrentLoad: jest.Mock;
    let mockReservePreparing: jest.Mock;
    let mockReserveFolder: jest.Mock;
    let mockReleaseFile: jest.Mock;
    let mockReleaseFolder: jest.Mock;
    let mockReset: jest.Mock;
    let mockFileExecutorExecute: jest.Mock;
    let mockFolderExecutorExecute: jest.Mock;
    let mockSetEventCallback: jest.Mock;
    let mockSubscribe: jest.Mock;
    let mockUnsubscribe: jest.Mock;
    let mockIsSubscribed: jest.Mock;
    let mockCheckAndUnsubscribeIfQueueEmpty: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        jest.mocked(UploadDriveClientRegistry.getDriveClient).mockReturnValue({} as any);
        jest.mocked(UploadDriveClientRegistry.getDrivePhotosClient).mockReturnValue({} as any);

        mockGetQueue = jest.fn().mockReturnValue([]);
        mockGetItem = jest.fn();
        mockUpdateQueueItems = jest.fn();

        jest.mocked(useUploadQueueStore.getState).mockReturnValue({
            getQueue: mockGetQueue,
            getItem: mockGetItem,
            updateQueueItems: mockUpdateQueueItems,
        } as any);

        jest.mocked(useUploadQueueStore.subscribe).mockReturnValue(jest.fn());

        mockGetNextTasks = jest.fn().mockReturnValue([]);
        jest.mocked(getNextTasks).mockImplementation(mockGetNextTasks);

        mockGetCurrentLoad = jest.fn().mockReturnValue({
            activePreparingFiles: 0,
            activeUploadingFiles: 0,
            activeFolders: 0,
            activeBytesTotal: 0,
            taskLoads: new Map(),
        });
        mockReservePreparing = jest.fn();
        mockReserveFolder = jest.fn();
        mockReleaseFile = jest.fn();
        mockReleaseFolder = jest.fn();
        mockReset = jest.fn();

        jest.mocked(CapacityManager).mockImplementation(
            () =>
                ({
                    getCurrentLoad: mockGetCurrentLoad,
                    reservePreparing: mockReservePreparing,
                    reserveFolder: mockReserveFolder,
                    releaseFile: mockReleaseFile,
                    releaseFolder: mockReleaseFolder,
                    reset: mockReset,
                }) as any
        );

        mockSetEventCallback = jest.fn();
        mockFileExecutorExecute = jest.fn().mockResolvedValue(undefined);
        jest.mocked(FileUploadExecutor).mockImplementation(
            () =>
                ({
                    setEventCallback: mockSetEventCallback,
                    execute: mockFileExecutorExecute,
                }) as any
        );

        mockFolderExecutorExecute = jest.fn().mockResolvedValue(undefined);
        jest.mocked(FolderCreationExecutor).mockImplementation(
            () =>
                ({
                    setEventCallback: mockSetEventCallback,
                    execute: mockFolderExecutorExecute,
                }) as any
        );

        mockSubscribe = jest.fn();
        mockUnsubscribe = jest.fn();
        mockIsSubscribed = jest.fn().mockReturnValue(false);
        mockCheckAndUnsubscribeIfQueueEmpty = jest.fn();

        jest.mocked(SDKTransferActivity).mockImplementation(
            () =>
                ({
                    subscribe: mockSubscribe,
                    unsubscribe: mockUnsubscribe,
                    isSubscribed: mockIsSubscribed,
                    checkAndUnsubscribeIfQueueEmpty: mockCheckAndUnsubscribeIfQueueEmpty,
                }) as any
        );

        jest.mocked(ConflictManager).mockImplementation(
            () =>
                ({
                    chooseConflictStrategy: jest.fn().mockResolvedValue(undefined),
                }) as any
        );

        jest.mocked(UploadEventHandler).mockImplementation(
            () =>
                ({
                    handleEvent: jest.fn().mockResolvedValue(undefined),
                }) as any
        );

        orchestrator = new UploadOrchestrator();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const createFileTask = (overrides = {}) => ({
        uploadId: 'file1',
        type: NodeType.File,
        name: 'test.txt',
        parentUid: 'parent1',
        batchId: 'batch1',
        file: new File(['content'], 'test.txt'),
        sizeEstimate: 1000,
        ...overrides,
    });

    const createFolderTask = (overrides = {}) => ({
        uploadId: 'folder1',
        type: NodeType.Folder,
        name: 'MyFolder',
        parentUid: 'parent1',
        batchId: 'batch1',
        modificationTime: new Date(),
        ...overrides,
    });

    const mockEmptyLoad = () => ({
        activePreparingFiles: 0,
        activeUploadingFiles: 0,
        activeFolders: 0,
        activeBytesTotal: 0,
        taskLoads: new Map(),
    });

    describe('start', () => {
        it('should not start if already running', async () => {
            mockGetNextTasks.mockReturnValue([]);
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', type: NodeType.File, status: UploadStatus.Pending }]);

            const startPromise1 = orchestrator.start();
            const startPromise2 = orchestrator.start();

            jest.advanceTimersByTime(200);
            orchestrator.stop();
            jest.advanceTimersByTime(200);

            await Promise.all([startPromise1, startPromise2]);

            expect(mockSubscribe).toHaveBeenCalledTimes(1);
        });

        it('should subscribe to SDK events if queue has items', async () => {
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', type: NodeType.File, status: UploadStatus.Pending }]);
            mockGetNextTasks.mockReturnValue([]);

            const startPromise = orchestrator.start();
            jest.advanceTimersByTime(200);
            orchestrator.stop();
            jest.advanceTimersByTime(200);

            await startPromise;

            expect(mockSubscribe).toHaveBeenCalled();
        });

        it('should not subscribe if already subscribed', async () => {
            mockIsSubscribed.mockReturnValue(true);
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', type: NodeType.File, status: UploadStatus.Pending }]);
            mockGetNextTasks.mockReturnValue([]);

            const startPromise = orchestrator.start();
            jest.advanceTimersByTime(200);
            orchestrator.stop();
            jest.advanceTimersByTime(200);

            await startPromise;

            expect(mockSubscribe).not.toHaveBeenCalled();
        });

        it('should unsubscribe when queue is empty', async () => {
            mockGetQueue.mockReturnValue([]);
            mockGetNextTasks.mockReturnValue([]);

            await orchestrator.start();

            expect(mockUnsubscribe).toHaveBeenCalled();
        });

        it('should execute scheduled tasks', async () => {
            const fileTask = createFileTask();
            mockGetQueue.mockReturnValueOnce([{ uploadId: 'file1', status: UploadStatus.Pending }]).mockReturnValue([]);
            mockGetNextTasks.mockReturnValueOnce([fileTask]).mockReturnValue([]);
            mockGetCurrentLoad.mockReturnValue(mockEmptyLoad());

            const startPromise = orchestrator.start();
            await jest.runAllTimersAsync();
            await startPromise;

            expect(mockFileExecutorExecute).toHaveBeenCalledWith(fileTask);
        });

        it('should reserve and release capacity for file uploads', async () => {
            const fileTask = createFileTask();
            mockGetQueue.mockReturnValueOnce([{ uploadId: 'file1', status: UploadStatus.Pending }]).mockReturnValue([]);
            mockGetNextTasks.mockReturnValueOnce([fileTask]).mockReturnValue([]);
            mockGetCurrentLoad.mockReturnValue(mockEmptyLoad());

            const startPromise = orchestrator.start();
            await jest.runAllTimersAsync();
            await startPromise;

            expect(mockReservePreparing).toHaveBeenCalledWith('file1');
            expect(mockReleaseFile).toHaveBeenCalledWith('file1');
        });

        it('should reserve and release capacity for folder creation', async () => {
            const folderTask = createFolderTask();
            mockGetQueue
                .mockReturnValueOnce([{ uploadId: 'folder1', status: UploadStatus.Pending }])
                .mockReturnValue([]);
            mockGetNextTasks.mockReturnValueOnce([folderTask]).mockReturnValue([]);
            mockGetCurrentLoad.mockReturnValue(mockEmptyLoad());

            const startPromise = orchestrator.start();
            await jest.runAllTimersAsync();
            await startPromise;

            expect(mockReserveFolder).toHaveBeenCalled();
            expect(mockReleaseFolder).toHaveBeenCalled();
        });

        it('should wait when no tasks available but uploads active', async () => {
            mockGetCurrentLoad.mockReturnValue({ activePreparingFiles: 0, activeUploadingFiles: 1, activeFolders: 0 });
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', status: UploadStatus.InProgress }]);
            mockGetNextTasks.mockReturnValue([]);

            const startPromise = orchestrator.start();

            jest.advanceTimersByTime(100);
            expect(mockGetNextTasks).toHaveBeenCalled();

            mockGetCurrentLoad.mockReturnValue({ activePreparingFiles: 0, activeUploadingFiles: 0, activeFolders: 0 });
            mockGetQueue.mockReturnValue([]);

            jest.advanceTimersByTime(100);

            await startPromise;
        });
    });

    describe('stop', () => {
        it('should stop the orchestration loop', async () => {
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', status: UploadStatus.Pending }]);
            mockGetNextTasks.mockReturnValue([]);

            const startPromise = orchestrator.start();
            orchestrator.stop();

            jest.advanceTimersByTime(200);

            await startPromise;

            expect(mockGetNextTasks).toHaveBeenCalled();
        });
    });

    describe('reset', () => {
        it('should reset capacity manager and unsubscribe', () => {
            orchestrator.reset();

            expect(mockReset).toHaveBeenCalled();
            expect(mockUnsubscribe).toHaveBeenCalled();
        });
    });

    describe('chooseConflictStrategy', () => {
        it('should resolve conflict and restart', async () => {
            mockGetQueue.mockReturnValue([]);
            mockGetNextTasks.mockReturnValue([]);

            await orchestrator.chooseConflictStrategy('file1', UploadConflictStrategy.Rename);

            const conflictManagerInstance = jest.mocked(ConflictManager).mock.results[0].value;
            expect(conflictManagerInstance.chooseConflictStrategy).toHaveBeenCalledWith(
                'file1',
                UploadConflictStrategy.Rename
            );
        });
    });

    describe('cancel', () => {
        it('should emit file:cancelled event for file uploads', async () => {
            mockGetItem.mockReturnValue({
                uploadId: 'file1',
                type: NodeType.File,
                status: UploadStatus.InProgress,
            });

            await orchestrator.cancel('file1');

            const eventHandlerInstance = jest.mocked(UploadEventHandler).mock.results[0].value;
            expect(eventHandlerInstance.handleEvent).toHaveBeenCalledWith({
                type: 'file:cancelled',
                uploadId: 'file1',
                isForPhotos: false,
            });
        });

        it('should emit folder:cancelled event for folder uploads', async () => {
            mockGetItem.mockReturnValue({
                uploadId: 'folder1',
                type: NodeType.Folder,
                status: UploadStatus.InProgress,
            });

            await orchestrator.cancel('folder1');

            const eventHandlerInstance = jest.mocked(UploadEventHandler).mock.results[0].value;
            expect(eventHandlerInstance.handleEvent).toHaveBeenCalledWith({
                type: 'folder:cancelled',
                uploadId: 'folder1',
            });
        });

        it('should not emit event when upload does not exist', async () => {
            mockGetItem.mockReturnValue(undefined);

            await orchestrator.cancel('nonexistent');

            const eventHandlerInstance = jest.mocked(UploadEventHandler).mock.results[0].value;
            expect(eventHandlerInstance.handleEvent).not.toHaveBeenCalled();
        });
    });

    describe('orchestrator loop with ConflictFound items', () => {
        it('should keep running when items are in ConflictFound status', async () => {
            let callCount = 0;
            mockGetQueue.mockImplementation(() => {
                callCount++;
                if (callCount > 5) {
                    return [];
                }
                return [{ uploadId: 'file1', status: UploadStatus.ConflictFound, type: NodeType.File }];
            });
            mockGetNextTasks.mockReturnValue([]);
            mockGetCurrentLoad.mockReturnValue({ activePreparingFiles: 0, activeUploadingFiles: 0, activeFolders: 0 });

            const startPromise = orchestrator.start();

            await jest.advanceTimersByTimeAsync(600);

            expect(mockGetQueue.mock.calls.length).toBeGreaterThan(5);

            await startPromise;
        });

        it('should exit when no ConflictFound, Pending, or InProgress items remain', async () => {
            mockGetQueue
                .mockReturnValueOnce([{ uploadId: 'file1', status: UploadStatus.ConflictFound, type: NodeType.File }])
                .mockReturnValueOnce([{ uploadId: 'file1', status: UploadStatus.Finished, type: NodeType.File }]);
            mockGetNextTasks.mockReturnValue([]);
            mockGetCurrentLoad.mockReturnValue({ activePreparingFiles: 0, activeUploadingFiles: 0, activeFolders: 0 });

            await orchestrator.start();

            expect(mockUnsubscribe).toHaveBeenCalled();
        });
    });
});
