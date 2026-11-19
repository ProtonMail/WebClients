import type { Mock } from 'vitest';

import { NodeType } from '../../../sdk';
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

vi.mock('../store/uploadQueue.store');
vi.mock('../execution/FileUploadExecutor');
vi.mock('../execution/FolderCreationExecutor');
vi.mock('./ConflictManager');
vi.mock('./SDKTransferActivity');
vi.mock('./UploadEventHandler');
vi.mock('../utils/schedulerHelpers');
vi.mock('../scheduling/CapacityManager');
vi.mock('../UploadDriveClientRegistry');

describe('UploadOrchestrator', () => {
    let orchestrator: UploadOrchestrator;
    let mockGetQueue: Mock;
    let mockGetItem: Mock;
    let mockUpdateQueueItems: Mock;
    let mockGetNextTasks: Mock;
    let mockGetCurrentLoad: Mock;
    let mockReservePreparing: Mock;
    let mockReserveFolder: Mock;
    let mockReleaseFile: Mock;
    let mockReleaseFolder: Mock;
    let mockReset: Mock;
    let mockFileExecutorExecute: Mock;
    let mockFolderExecutorExecute: Mock;
    let mockSetEventCallback: Mock;
    let mockSubscribe: Mock;
    let mockUnsubscribe: Mock;
    let mockIsSubscribed: Mock;
    let mockCheckAndUnsubscribeIfQueueEmpty: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        vi.mocked(UploadDriveClientRegistry.getDriveClient).mockReturnValue({} as any);
        vi.mocked(UploadDriveClientRegistry.getDrivePhotosClient).mockReturnValue({} as any);

        mockGetQueue = vi.fn().mockReturnValue([]);
        mockGetItem = vi.fn();
        mockUpdateQueueItems = vi.fn();

        vi.mocked(useUploadQueueStore.getState).mockReturnValue({
            getQueue: mockGetQueue,
            getItem: mockGetItem,
            updateQueueItems: mockUpdateQueueItems,
        } as any);

        vi.mocked(useUploadQueueStore.subscribe).mockReturnValue(vi.fn());

        mockGetNextTasks = vi.fn().mockReturnValue([]);
        vi.mocked(getNextTasks).mockImplementation(mockGetNextTasks);

        mockGetCurrentLoad = vi.fn().mockReturnValue({
            activePreparingFiles: 0,
            activeUploadingFiles: 0,
            activeFolders: 0,
            activeBytesTotal: 0,
            taskLoads: new Map(),
        });
        mockReservePreparing = vi.fn();
        mockReserveFolder = vi.fn();
        mockReleaseFile = vi.fn();
        mockReleaseFolder = vi.fn();
        mockReset = vi.fn();

        vi.mocked(CapacityManager).mockImplementation(function () {
            return {
                getCurrentLoad: mockGetCurrentLoad,
                reservePreparing: mockReservePreparing,
                reserveFolder: mockReserveFolder,
                releaseFile: mockReleaseFile,
                releaseFolder: mockReleaseFolder,
                reset: mockReset,
            } as any;
        });

        mockSetEventCallback = vi.fn();
        mockFileExecutorExecute = vi.fn().mockResolvedValue(undefined);
        vi.mocked(FileUploadExecutor).mockImplementation(function () {
            return {
                setEventCallback: mockSetEventCallback,
                execute: mockFileExecutorExecute,
            } as any;
        });

        mockFolderExecutorExecute = vi.fn().mockResolvedValue(undefined);
        vi.mocked(FolderCreationExecutor).mockImplementation(function () {
            return {
                setEventCallback: mockSetEventCallback,
                execute: mockFolderExecutorExecute,
            } as any;
        });

        mockSubscribe = vi.fn();
        mockUnsubscribe = vi.fn();
        mockIsSubscribed = vi.fn().mockReturnValue(false);
        mockCheckAndUnsubscribeIfQueueEmpty = vi.fn();

        vi.mocked(SDKTransferActivity).mockImplementation(function () {
            return {
                subscribe: mockSubscribe,
                unsubscribe: mockUnsubscribe,
                isSubscribed: mockIsSubscribed,
                checkAndUnsubscribeIfQueueEmpty: mockCheckAndUnsubscribeIfQueueEmpty,
            } as any;
        });

        vi.mocked(ConflictManager).mockImplementation(function () {
            return {
                chooseConflictStrategy: vi.fn().mockResolvedValue(undefined),
            } as any;
        });

        vi.mocked(UploadEventHandler).mockImplementation(function () {
            return {
                handleEvent: vi.fn().mockResolvedValue(undefined),
                cancel: vi.fn(),
            } as any;
        });

        orchestrator = new UploadOrchestrator();
    });

    afterEach(() => {
        vi.useRealTimers();
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

            vi.advanceTimersByTime(200);
            orchestrator.stop();
            vi.advanceTimersByTime(200);

            await Promise.all([startPromise1, startPromise2]);

            expect(mockSubscribe).toHaveBeenCalledTimes(1);
        });

        it('should subscribe to SDK events if queue has items', async () => {
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', type: NodeType.File, status: UploadStatus.Pending }]);
            mockGetNextTasks.mockReturnValue([]);

            const startPromise = orchestrator.start();
            vi.advanceTimersByTime(200);
            orchestrator.stop();
            vi.advanceTimersByTime(200);

            await startPromise;

            expect(mockSubscribe).toHaveBeenCalled();
        });

        it('should not subscribe if already subscribed', async () => {
            mockIsSubscribed.mockReturnValue(true);
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', type: NodeType.File, status: UploadStatus.Pending }]);
            mockGetNextTasks.mockReturnValue([]);

            const startPromise = orchestrator.start();
            vi.advanceTimersByTime(200);
            orchestrator.stop();
            vi.advanceTimersByTime(200);

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
            await vi.runAllTimersAsync();
            await startPromise;

            expect(mockFileExecutorExecute).toHaveBeenCalledWith(fileTask);
        });

        it('should reserve and release capacity for file uploads', async () => {
            const fileTask = createFileTask();
            mockGetQueue.mockReturnValueOnce([{ uploadId: 'file1', status: UploadStatus.Pending }]).mockReturnValue([]);
            mockGetNextTasks.mockReturnValueOnce([fileTask]).mockReturnValue([]);
            mockGetCurrentLoad.mockReturnValue(mockEmptyLoad());

            const startPromise = orchestrator.start();
            await vi.runAllTimersAsync();
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
            await vi.runAllTimersAsync();
            await startPromise;

            expect(mockReserveFolder).toHaveBeenCalled();
            expect(mockReleaseFolder).toHaveBeenCalled();
        });

        it('should wait when no tasks available but uploads active', async () => {
            mockGetCurrentLoad.mockReturnValue({ activePreparingFiles: 0, activeUploadingFiles: 1, activeFolders: 0 });
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', status: UploadStatus.InProgress }]);
            mockGetNextTasks.mockReturnValue([]);

            const startPromise = orchestrator.start();

            await vi.advanceTimersByTimeAsync(600);
            expect(mockGetNextTasks).toHaveBeenCalled();

            mockGetCurrentLoad.mockReturnValue({ activePreparingFiles: 0, activeUploadingFiles: 0, activeFolders: 0 });
            mockGetQueue.mockReturnValue([]);

            await vi.advanceTimersByTimeAsync(600);

            await startPromise;
        });
    });

    describe('stop', () => {
        it('should stop the orchestration loop', async () => {
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', status: UploadStatus.Pending }]);
            mockGetNextTasks.mockReturnValue([]);

            const startPromise = orchestrator.start();
            orchestrator.stop();

            vi.advanceTimersByTime(200);

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

            const conflictManagerInstance = vi.mocked(ConflictManager).mock.results[0].value;
            expect(conflictManagerInstance.chooseConflictStrategy).toHaveBeenCalledWith(
                'file1',
                UploadConflictStrategy.Rename
            );
        });
    });

    describe('cancel', () => {
        it('should delegate to eventHandler.cancel', () => {
            orchestrator.cancel(['file1', 'folder1']);

            const eventHandlerInstance = vi.mocked(UploadEventHandler).mock.results[0].value;
            expect(eventHandlerInstance.cancel).toHaveBeenCalledWith(['file1', 'folder1']);
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

            await vi.advanceTimersByTimeAsync(3500);

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
