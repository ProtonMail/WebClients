import type { DownloadableItem } from './downloadTypes';
import { createDeferred, createEmptyAsyncGenerator, flushAsync, trackInstances, waitForCondition } from './testUtils';

const schedulerTracker = trackInstances((...args: unknown[]) => {
    let counter = 0;
    return {
        constructorArgs: args,
        scheduleDownload: jest.fn(),
        cancelDownload: jest.fn(),
        clearDownloads: jest.fn(),
        generateTaskId: jest.fn(() => `scheduler-task-${++counter}`),
        updateDownloadProgress: jest.fn(),
    };
});

const archiveStreamGeneratorTracker = trackInstances((...args: unknown[]) => ({
    constructorArgs: args,
    controller: {
        pause: jest.fn(),
        resume: jest.fn(),
        completion: jest.fn().mockResolvedValue(undefined),
    },
    generator: createEmptyAsyncGenerator<unknown>(),
}));

const archiveGeneratorTracker = trackInstances(() => ({
    stream: 'archive-stream',
    writeLinks: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn(),
}));

const fileSaverSaveAsFileMock = jest.fn();
const loadCreateReadableStreamWrapperMock = jest.fn();
const nodesStructureTraversalMock = jest.fn();

jest.mock('../../store/_downloads/fileSaver/fileSaver', () => ({
    __esModule: true,
    default: {
        instance: {
            saveAsFile: fileSaverSaveAsFileMock,
        },
    },
}));

jest.mock('../../utils/webStreamsPolyfill', () => ({
    loadCreateReadableStreamWrapper: loadCreateReadableStreamWrapperMock,
}));

jest.mock('../../zustand/download/downloadManager.store', () => {
    const actual = jest.requireActual('../../zustand/download/downloadManager.store');
    const mockState = {
        addDownloadItem: jest.fn(),
        updateDownloadItem: jest.fn(),
        getQueueItem: jest.fn(),
        clearQueue: jest.fn(),
        removeDownloadItems: jest.fn(),
        getQueue: jest.fn(),
        queue: new Map<string, unknown>(),
    };
    const getState = jest.fn(() => mockState);
    return {
        ...actual,
        useDownloadManagerStore: {
            getState,
        },
        mockStoreState: mockState,
    };
});

jest.mock('./DownloadScheduler', () => ({
    DownloadScheduler: schedulerTracker.Mock,
}));

jest.mock('./ArchiveStreamGenerator', () => ({
    ArchiveStreamGenerator: archiveStreamGeneratorTracker.Mock,
}));

jest.mock('./ArchiveGenerator', () => ({
    __esModule: true,
    default: archiveGeneratorTracker.Mock,
}));

jest.mock('./utils/nodesStructureTraversal', () => ({
    nodesStructureTraversal: nodesStructureTraversalMock,
}));

jest.mock('@proton/drive/index', () => {
    const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
    const driveMock = {
        onMessage: jest.fn((event: string, callback: (...args: unknown[]) => void) => {
            listeners[event] = listeners[event] || [];
            listeners[event].push(callback);
            return () => {
                listeners[event] = listeners[event].filter((fn) => fn !== callback);
            };
        }),
        getFileDownloader: jest.fn(),
        iterateFolderChildren: jest.fn(),
    };
    class AbortError extends Error {}
    const getDrive = jest.fn(() => driveMock);
    const emitSDKEvent = (event: string, ...args: unknown[]) => {
        (listeners[event] || []).forEach((listener) => listener(...args));
    };
    const resetSDKListeners = () => {
        Object.keys(listeners).forEach((key) => {
            listeners[key] = [];
        });
    };
    return {
        AbortError,
        SDKEvent: {
            TransfersPaused: 'TransfersPaused',
            TransfersResumed: 'TransfersResumed',
        },
        getDrive,
        driveMock,
        emitSDKEvent,
        resetSDKListeners,
    };
});

const { DownloadManager } = require('./DownloadManager');
const {
    DownloadStatus,
    MalawareDownloadResolution,
    useDownloadManagerStore,
    mockStoreState: storeMockState,
} = require('../../zustand/download/downloadManager.store');
const sdkMock = require('@proton/drive/index') as {
    AbortError: typeof Error;
    SDKEvent: { TransfersPaused: string; TransfersResumed: string };
    getDrive: jest.Mock;
    driveMock: {
        onMessage: jest.Mock;
        getFileDownloader: jest.Mock;
        iterateFolderChildren: jest.Mock;
    };
    emitSDKEvent: (event: string, ...args: unknown[]) => void;
    resetSDKListeners: () => void;
};

const getSchedulerInstance = () => {
    const instance = schedulerTracker.instances[schedulerTracker.instances.length - 1];
    if (!instance) {
        throw new Error('Expected scheduler instance to be initialised');
    }
    return instance;
};

const getArchiveStreamGeneratorInstance = () => {
    const instance = archiveStreamGeneratorTracker.instances[archiveStreamGeneratorTracker.instances.length - 1];
    if (!instance) {
        throw new Error('Expected archive stream generator to be initialised');
    }
    return instance;
};

const getArchiveGeneratorInstance = () => {
    const instance = archiveGeneratorTracker.instances[archiveGeneratorTracker.instances.length - 1];
    if (!instance) {
        throw new Error('Expected archive generator to be initialised');
    }
    return instance;
};

const resetSingleton = () => {
    Reflect.set(DownloadManager, 'instance', undefined);
};

beforeEach(() => {
    jest.clearAllMocks();

    const getStateMock = useDownloadManagerStore.getState as jest.Mock;
    getStateMock.mockReset();
    getStateMock.mockReturnValue(storeMockState);

    storeMockState.addDownloadItem.mockReset();
    storeMockState.updateDownloadItem.mockReset();
    storeMockState.getQueueItem.mockReset();
    storeMockState.clearQueue.mockReset();
    storeMockState.removeDownloadItems.mockReset();
    storeMockState.getQueue.mockReset();
    storeMockState.queue = new Map();

    loadCreateReadableStreamWrapperMock.mockReset();
    fileSaverSaveAsFileMock.mockReset();
    nodesStructureTraversalMock.mockReset();

    schedulerTracker.reset();
    archiveStreamGeneratorTracker.reset();
    archiveGeneratorTracker.reset();

    sdkMock.getDrive.mockClear();
    sdkMock.driveMock.getFileDownloader.mockReset();
    sdkMock.driveMock.onMessage.mockClear();
    sdkMock.resetSDKListeners();

    resetSingleton();
});

describe('DownloadManager', () => {
    it('should return the singleton instance', () => {
        const first = DownloadManager.getInstance();
        const second = DownloadManager.getInstance();

        expect(first).toBe(second);
    });

    it('should ignore download requests without nodes', async () => {
        const manager = DownloadManager.getInstance();
        await manager.download([]);

        expect(storeMockState.addDownloadItem).not.toHaveBeenCalled();
        const schedulerInstance = getSchedulerInstance();
        expect(schedulerInstance.scheduleDownload).not.toHaveBeenCalled();
    });

    it('should download a single file and update state on success', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        storeMockState.addDownloadItem.mockReturnValue('download-1');

        const node: DownloadableItem = {
            uid: 'file-1',
            name: 'file.txt',
            isFile: true,
            storageSize: 128,
        };

        const controllerCompletion = createDeferred<void>();
        const controller = {
            pause: jest.fn(),
            resume: jest.fn(),
            completion: jest.fn(() => controllerCompletion.promise),
        };
        const fileDownloader = {
            getClaimedSizeInBytes: jest.fn(() => node.storageSize),
            downloadToStream: jest.fn((_writable: unknown, onProgress: (bytes: number) => void) => {
                onProgress(64);
                return controller;
            }),
        };

        sdkMock.driveMock.getFileDownloader.mockResolvedValue(fileDownloader);

        const readableStream = {} as ReadableStream<Uint8Array<ArrayBuffer>>;
        loadCreateReadableStreamWrapperMock.mockResolvedValue(readableStream);

        const saveDeferred = createDeferred<void>();
        fileSaverSaveAsFileMock.mockReturnValue(saveDeferred.promise);

        await manager.download([node]);

        expect(storeMockState.addDownloadItem).toHaveBeenCalledWith({
            name: node.name,
            storageSize: node.storageSize,
            downloadedBytes: 0,
            status: DownloadStatus.Pending,
            nodeUids: [node.uid],
        });

        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);
        const scheduledTask = schedulerInstance.scheduleDownload.mock.calls[0][0];
        expect(scheduledTask.node).toEqual(node);

        const handle = await scheduledTask.start();

        const activeDownloads = Reflect.get(manager, 'activeDownloads') as Map<string, unknown>;
        expect(activeDownloads.has('download-1')).toBe(true);
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('download-1', {
            storageSize: node.storageSize,
        });

        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('download-1', {
            status: DownloadStatus.InProgress,
        });
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('download-1', { downloadedBytes: 64 });

        controllerCompletion.resolve();
        saveDeferred.resolve();

        await handle.completion;

        expect(fileSaverSaveAsFileMock).toHaveBeenCalledWith(
            readableStream,
            { filename: node.name, mimeType: 'application/octet-stream', size: node.storageSize },
            expect.any(Function)
        );
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('download-1', {
            status: DownloadStatus.Finalizing,
        });
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('download-1', {
            status: DownloadStatus.Finished,
        });
        expect(activeDownloads.has('download-1')).toBe(false);
    });

    it('should mark a single file download as failed when the SDK throws', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        storeMockState.addDownloadItem.mockReturnValue('download-1');

        const node: DownloadableItem = {
            uid: 'file-2',
            name: 'broken.txt',
            isFile: true,
        };

        const failure = new Error('sdk failure');
        sdkMock.driveMock.getFileDownloader.mockRejectedValue(failure);

        await manager.download([node]);
        const scheduledTask = schedulerInstance.scheduleDownload.mock.calls[0][0];

        await expect(scheduledTask.start()).rejects.toBe(failure);
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('download-1', {
            status: DownloadStatus.Failed,
            error: failure,
        });
    });

    it('should reuse existing queue items when retrying a single download', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        const node: DownloadableItem = {
            uid: 'file-retry',
            name: 'retry-me.txt',
            isFile: true,
            storageSize: 256,
        };

        storeMockState.addDownloadItem.mockReturnValue('download-retry');

        await manager.download([node]);

        expect(storeMockState.addDownloadItem).toHaveBeenCalledTimes(1);
        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);

        schedulerInstance.scheduleDownload.mockClear();
        storeMockState.addDownloadItem.mockClear();
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.Failed });

        manager.retry(['download-retry']);

        expect(storeMockState.addDownloadItem).not.toHaveBeenCalled();
        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);
        const retriedTask = schedulerInstance.scheduleDownload.mock.calls[0][0];
        expect(retriedTask.node).toEqual(node);
    });

    it('should reuse existing queue items when retrying an archive download', async () => {
        const manager = DownloadManager.getInstance();

        const nodes: DownloadableItem[] = [
            { uid: 'file-a', name: 'a.txt', isFile: true, storageSize: 100 },
            { uid: 'file-b', name: 'b.txt', isFile: true, storageSize: 200 },
        ];

        storeMockState.addDownloadItem.mockReturnValue('archive-retry');
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.Failed });
        storeMockState.getQueueItem.mockReturnValueOnce(undefined);

        const iteratorMock = jest.fn().mockReturnValue(createEmptyAsyncGenerator<DownloadableItem>());
        nodesStructureTraversalMock.mockReturnValue({
            nodesQueue: { iterator: iteratorMock },
            totalEncryptedSizePromise: Promise.resolve(0),
        });

        fileSaverSaveAsFileMock.mockResolvedValue(undefined);
        archiveGeneratorTracker.setFactory(() => ({
            stream: 'archive-stream',
            writeLinks: jest.fn().mockResolvedValue(undefined),
            cancel: jest.fn(),
        }));

        await manager.download(nodes);

        expect(storeMockState.addDownloadItem).toHaveBeenCalledTimes(1);
        expect(nodesStructureTraversalMock).toHaveBeenCalledTimes(1);
        expect(nodesStructureTraversalMock.mock.calls[0][0]).toEqual(nodes);
        expect(archiveStreamGeneratorTracker.instances).toHaveLength(1);

        manager.retry(['archive-retry']);
        await flushAsync();

        expect(storeMockState.addDownloadItem).toHaveBeenCalledTimes(1);
        expect(nodesStructureTraversalMock).toHaveBeenCalledTimes(2);
        expect(nodesStructureTraversalMock.mock.calls[1][0]).toEqual(nodes);
        expect(archiveStreamGeneratorTracker.instances).toHaveLength(2);

        archiveGeneratorTracker.restoreFactory();
    });

    it('should start archive downloads for multiple nodes and finalize on completion', async () => {
        const manager = DownloadManager.getInstance();

        storeMockState.addDownloadItem.mockReturnValue('archive-id');
        storeMockState.getQueueItem.mockReturnValue(undefined);

        const iteratorMock = jest.fn().mockReturnValue(createEmptyAsyncGenerator<DownloadableItem>());
        const totalSizeDeferred = createDeferred<number>();
        nodesStructureTraversalMock.mockReturnValue({
            nodesQueue: { iterator: iteratorMock },
            totalEncryptedSizePromise: totalSizeDeferred.promise,
        });

        const writeLinksDeferred = createDeferred<void>();
        archiveGeneratorTracker.setFactory(() => ({
            stream: 'archive-stream',
            writeLinks: jest.fn().mockReturnValue(writeLinksDeferred.promise),
            cancel: jest.fn(),
        }));

        const saveDeferred = createDeferred<void>();
        fileSaverSaveAsFileMock.mockReturnValue(saveDeferred.promise);

        const nodes: DownloadableItem[] = [
            { uid: 'folder-1', name: 'folder', isFile: false },
            { uid: 'file-3', name: 'photo.jpg', isFile: true, storageSize: 2048 },
        ];

        await manager.download(nodes);

        expect(nodesStructureTraversalMock).toHaveBeenCalled();
        const traversalArgs = nodesStructureTraversalMock.mock.calls[0];
        expect(traversalArgs[0]).toEqual(nodes);
        expect(traversalArgs[1]).toHaveProperty('aborted', false);

        const archiveInstance = getArchiveStreamGeneratorInstance();
        expect(archiveInstance.constructorArgs[0]).toBe(iteratorMock.mock.results[0].value);
        expect(archiveInstance.constructorArgs[2]).toBe(getSchedulerInstance());

        const onProgress = archiveInstance.constructorArgs[1] as (downloadedBytes: number) => void;
        onProgress(512);
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('archive-id', { downloadedBytes: 512 });

        const archiveGeneratorInstance = getArchiveGeneratorInstance();
        expect(archiveGeneratorInstance.writeLinks).toHaveBeenCalledWith(archiveInstance.generator);

        expect(fileSaverSaveAsFileMock).toHaveBeenCalledWith(
            'archive-stream',
            {
                filename: expect.stringMatching(/\.zip$/),
                mimeType: 'application/zip',
                size: undefined,
            },
            expect.any(Function)
        );

        const activeDownloads = Reflect.get(manager, 'activeDownloads') as Map<string, unknown>;
        expect(activeDownloads.has('archive-id')).toBe(true);

        totalSizeDeferred.resolve(4096);
        writeLinksDeferred.resolve();
        saveDeferred.resolve();
        await flushAsync(2);

        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('archive-id', {
            status: DownloadStatus.Finalizing,
        });
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('archive-id', {
            status: DownloadStatus.Finished,
        });
        await waitForCondition(() => !activeDownloads.has('archive-id'));

        archiveGeneratorTracker.restoreFactory();
    });

    it('should pause active downloads and update their status', () => {
        const manager = DownloadManager.getInstance();
        const activeDownload = {
            controller: { pause: jest.fn(), resume: jest.fn(), completion: jest.fn() },
            abortController: { abort: jest.fn() },
        };
        Reflect.set(manager, 'activeDownloads', new Map([['job-1', activeDownload]]));
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.InProgress });

        manager.pause(['job-1']);

        expect(activeDownload.controller.pause).toHaveBeenCalled();
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('job-1', { status: DownloadStatus.Paused });
    });

    it('should resume paused downloads and update their status', () => {
        const manager = DownloadManager.getInstance();
        const activeDownload = {
            controller: { pause: jest.fn(), resume: jest.fn(), completion: jest.fn() },
            abortController: { abort: jest.fn() },
        };
        Reflect.set(manager, 'activeDownloads', new Map([['job-2', activeDownload]]));
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.Paused });

        manager.resume(['job-2']);

        expect(activeDownload.controller.resume).toHaveBeenCalled();
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('job-2', {
            status: DownloadStatus.InProgress,
        });
    });

    it('should cancel downloads by aborting controllers and marking them cancelled', () => {
        const manager = DownloadManager.getInstance();
        const abortMock = jest.fn();
        const activeDownload = {
            controller: { pause: jest.fn(), resume: jest.fn(), completion: jest.fn() },
            abortController: { abort: abortMock },
        };
        Reflect.set(manager, 'activeDownloads', new Map([['job-3', activeDownload]]));
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.InProgress });

        manager.cancel(['job-3']);

        expect(abortMock).toHaveBeenCalled();
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('job-3', {
            status: DownloadStatus.Cancelled,
        });
    });

    it('should clear active downloads, scheduler, and queue', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();
        const abortMock = jest.fn();
        const activeDownload = {
            controller: { pause: jest.fn(), resume: jest.fn(), completion: jest.fn() },
            abortController: { abort: abortMock },
        };
        Reflect.set(manager, 'activeDownloads', new Map([['job-4', activeDownload]]));
        storeMockState.queue = new Map([
            ['job-4', {}],
            ['job-5', {}],
        ]);

        await manager.clear();

        expect(abortMock).toHaveBeenCalled();
        expect(schedulerInstance.clearDownloads).toHaveBeenCalled();
        expect(storeMockState.clearQueue).toHaveBeenCalled();
    });

    it('should delegate malware resolution to cancel or resume', () => {
        const manager = DownloadManager.getInstance();
        const cancelSpy = jest.spyOn(manager, 'cancel').mockImplementation(() => undefined);
        const resumeSpy = jest.spyOn(manager, 'resume').mockImplementation(() => undefined);

        manager.resolveMalwareDetection('job-6', MalawareDownloadResolution.CancelDownload);
        expect(cancelSpy).toHaveBeenCalledWith(['job-6']);

        manager.resolveMalwareDetection('job-6', MalawareDownloadResolution.ContinueDownload);
        expect(resumeSpy).toHaveBeenCalledWith(['job-6']);
    });

    it('should subscribe to SDK events once and update status on pause/resume', () => {
        const manager = DownloadManager.getInstance();
        const activeDownload = {
            controller: { pause: jest.fn(), resume: jest.fn(), completion: jest.fn() },
            abortController: { abort: jest.fn() },
        };
        Reflect.set(manager, 'activeDownloads', new Map([['job-7', activeDownload]]));

        let currentStatus = DownloadStatus.InProgress;
        storeMockState.getQueueItem.mockImplementation(() => ({ status: currentStatus }));

        manager.addListeners();
        manager.addListeners();

        expect(sdkMock.driveMock.onMessage).toHaveBeenCalledTimes(2);

        sdkMock.emitSDKEvent(sdkMock.SDKEvent.TransfersPaused);
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('job-7', {
            status: DownloadStatus.PausedServer,
        });

        storeMockState.updateDownloadItem.mockClear();
        currentStatus = DownloadStatus.PausedServer;

        sdkMock.emitSDKEvent(sdkMock.SDKEvent.TransfersResumed);
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('job-7', {
            status: DownloadStatus.InProgress,
        });
    });
});
