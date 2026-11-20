import type { Mock, MockInstance } from 'vitest';

import { getNodeName } from '@proton/drive/modules/nodes';
import { createMockNodeEntity } from '@proton/drive/modules/testing';
import type { NodeEntity, ProtonDrivePhotosClient } from '@proton/drive/sdk';
import { AbortError, NodeType } from '@proton/drive/sdk';

import type * as DownloadManagerModule from './DownloadManager';
import type * as DownloadStoreModule from './downloadManager.store';
import { createDeferred, createEmptyAsyncGenerator, flushAsync, trackInstances, waitForCondition } from './testUtils';

const schedulerTracker = trackInstances((...args: unknown[]) => {
    let counter = 0;
    return {
        constructorArgs: args,
        scheduleDownload: vi.fn(),
        cancelDownloadsById: vi.fn(),
        cancelDownload: vi.fn(),
        clearDownloads: vi.fn(),
        generateTaskId: vi.fn(() => `scheduler-task-${++counter}`),
        updateDownloadProgress: vi.fn(),
    };
});

const archiveStreamGeneratorTracker = trackInstances((...args: unknown[]) => ({
    constructorArgs: args,
    controller: {
        pause: vi.fn(),
        resume: vi.fn(),
        completion: vi.fn().mockResolvedValue(undefined),
    },
    generator: createEmptyAsyncGenerator<unknown>(),
    waitForFirstItem: vi.fn().mockResolvedValue(undefined),
}));

const createClosedReadableStream = () =>
    new ReadableStream<Uint8Array<ArrayBuffer>>({
        start(controller) {
            controller.close();
        },
    });

const archiveGeneratorTracker = trackInstances(() => ({
    stream: createClosedReadableStream(),
    writeLinks: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn(),
}));

const fileSaverSaveAsFileMock = vi.fn();
const loadCreateReadableStreamWrapperMock = vi.fn();
const traverseNodeStructureMock = vi.fn();
const traverseAlbumMock = vi.fn();
const hydrateAndCheckNodesMock = vi.fn();
const hydrateAndCheckPhotosMock = vi.fn();
const getDownloadSdkMock = vi.fn();

vi.mock('../../modules/fileSaver/fileSaver', () => ({
    __esModule: true,
    fileSaver: {
        saveAsFile: fileSaverSaveAsFileMock,
    },
}));

vi.mock('../../utils/webStreamsPolyfill', () => ({
    loadCreateReadableStreamWrapper: loadCreateReadableStreamWrapperMock,
}));

vi.mock('./downloadManager.store', async () => {
    const actual = await vi.importActual('./downloadManager.store');
    const mockState = {
        addDownloadItem: vi.fn(),
        updateDownloadItem: vi.fn(),
        getQueueItem: vi.fn(),
        clearQueue: vi.fn(),
        removeDownloadItems: vi.fn(),
        getQueue: vi.fn(),
        queue: new Map<string, unknown>(),
    };
    const getState = vi.fn(() => mockState);
    return {
        ...actual,
        useDownloadManagerStore: {
            getState,
        },
        mockStoreState: mockState,
    };
});

vi.mock('./DownloadScheduler', () => ({
    DownloadScheduler: schedulerTracker.Mock,
}));

vi.mock('./ArchiveStreamGenerator', () => ({
    ArchiveStreamGenerator: archiveStreamGeneratorTracker.Mock,
}));

vi.mock('./ArchiveGenerator', () => ({
    __esModule: true,
    default: archiveGeneratorTracker.Mock,
}));

const isIosMock = vi.fn(() => false);
vi.mock('@proton/shared/lib/helpers/browser', async () => ({
    ...(await vi.importActual('@proton/shared/lib/helpers/browser')),
    isIos: () => isIosMock(),
}));

vi.mock('./utils/traverseNodeStructure', () => ({
    traverseNodeStructure: traverseNodeStructureMock,
    traverseAlbum: traverseAlbumMock,
}));

vi.mock('./utils/hydrateAndCheckNodes', () => ({
    hydrateAndCheckNodes: hydrateAndCheckNodesMock,
    hydratePhotos: hydrateAndCheckPhotosMock,
}));

const detectMetadataSignatureIssueMock = vi.fn();
const addAndWaitForManifestIssueDecisionMock = vi.fn();
const addAndWaitForMetadataIssueDecisionMock = vi.fn();
vi.mock('./utils/signatureIssues', () => ({
    detectMetadataSignatureIssue: detectMetadataSignatureIssueMock,
    addAndWaitForManifestIssueDecision: addAndWaitForManifestIssueDecisionMock,
    addAndWaitForMetadataIssueDecision: addAndWaitForMetadataIssueDecisionMock,
}));

vi.mock('./utils/getDownloadSdk', () => ({
    getDownloadSdk: getDownloadSdkMock,
}));

vi.mock('@proton/drive/sdk', async () => {
    const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
    const driveMock = {
        onMessage: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
            listeners[event] = listeners[event] || [];
            listeners[event].push(callback);
            return () => {
                listeners[event] = listeners[event].filter((fn) => fn !== callback);
            };
        }),
        getFileDownloader: vi.fn(),
    };
    class AbortError extends Error {
        name = 'AbortError';
    }
    const getDrive = vi.fn(() => driveMock);
    const getDriveForPhotos = vi.fn(() => driveMock);
    const emitSDKEvent = (event: string, ...args: unknown[]) => {
        (listeners[event] || []).forEach((listener) => listener(...args));
    };
    const resetSDKListeners = () => {
        Object.keys(listeners).forEach((key) => {
            listeners[key] = [];
        });
    };
    const actual = await vi.importActual('@proton/drive/sdk');
    return {
        ...actual,
        AbortError,
        SDKEvent: {
            TransfersPaused: 'TransfersPaused',
            TransfersResumed: 'TransfersResumed',
        },
        getDrive,
        getDriveForPhotos,
        driveMock,
        emitSDKEvent,
        resetSDKListeners,
    };
});

vi.mock('./DownloadDriveClientRegistry', async () => {
    const sdkMock = (await import('@proton/drive/sdk')) as unknown as { driveMock: unknown };
    let customDriveClient: unknown;
    let customDrivePhotosClient: unknown;
    return {
        DownloadDriveClientRegistry: {
            getDriveClient: vi.fn(() => {
                return customDriveClient || sdkMock.driveMock;
            }),
            getDrivePhotosClient: vi.fn(() => {
                return customDrivePhotosClient || sdkMock.driveMock;
            }),
            setDriveClient: vi.fn((client) => {
                customDriveClient = client;
            }),
            setDrivePhotosClient: vi.fn((client) => {
                customDrivePhotosClient = client;
            }),
            reset: vi.fn(() => {
                customDriveClient = undefined;
                customDrivePhotosClient = undefined;
            }),
        },
    };
});

const { DownloadManager } = await vi.importActual<typeof DownloadManagerModule>('./DownloadManager');
const { DownloadStatus, MalwareDownloadResolution, IssueStatus } =
    await vi.importActual<typeof DownloadStoreModule>('./downloadManager.store');
const { useDownloadManagerStore, mockStoreState: storeMockState } = (await import('./downloadManager.store')) as any;
const sdkMock = (await import('@proton/drive/sdk')) as unknown as {
    AbortError: typeof Error;
    SDKEvent: { TransfersPaused: string; TransfersResumed: string };
    getDrive: Mock;
    getDriveForPhotos: Mock;
    driveMock: {
        onMessage: Mock;
        getFileDownloader: Mock;
    };
    emitSDKEvent: (event: string, ...args: unknown[]) => void;
    resetSDKListeners: () => void;
};
const { DownloadDriveClientRegistry } = await import('./DownloadDriveClientRegistry');

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

let consoleWarnSpy: MockInstance;

beforeEach(() => {
    vi.clearAllMocks();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const getStateMock = vi.mocked(useDownloadManagerStore.getState);
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
    loadCreateReadableStreamWrapperMock.mockImplementation(async () => ({
        cancel: vi.fn().mockResolvedValue(undefined),
        locked: false,
    }));
    fileSaverSaveAsFileMock.mockReset();
    traverseNodeStructureMock.mockReset();
    traverseAlbumMock.mockReset();
    hydrateAndCheckNodesMock.mockReset();
    hydrateAndCheckPhotosMock.mockReset();
    getDownloadSdkMock.mockReset();
    getDownloadSdkMock.mockReturnValue(sdkMock.driveMock);

    schedulerTracker.reset();
    archiveStreamGeneratorTracker.reset();
    archiveGeneratorTracker.reset();

    // Default: no signature issues on metadata
    detectMetadataSignatureIssueMock.mockReturnValue(undefined);
    addAndWaitForManifestIssueDecisionMock.mockReset();
    addAndWaitForMetadataIssueDecisionMock.mockReset();

    sdkMock.getDrive.mockClear();
    sdkMock.getDriveForPhotos.mockClear();
    sdkMock.driveMock.getFileDownloader.mockReset();
    sdkMock.driveMock.onMessage.mockClear();
    sdkMock.resetSDKListeners();

    DownloadDriveClientRegistry.reset();

    resetSingleton();
});

afterEach(() => {
    consoleWarnSpy.mockRestore();
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

        expect(hydrateAndCheckNodesMock).not.toHaveBeenCalled();
        expect(storeMockState.addDownloadItem).not.toHaveBeenCalled();
        const schedulerInstance = getSchedulerInstance();
        expect(schedulerInstance.scheduleDownload).not.toHaveBeenCalled();
    });

    it('should download a single file and update state on success', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        storeMockState.addDownloadItem.mockReturnValue('download-1');

        const node: NodeEntity = createMockNodeEntity({
            uid: 'file-1',
            name: { ok: true as const, value: 'file.txt' },
        });
        const nodeSize = node.activeRevision?.storageSize ?? 0;
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes: [node], containsSheetOrDoc: false });

        const controllerCompletion = createDeferred<void>();
        const controller = {
            pause: vi.fn(),
            resume: vi.fn(),
            completion: vi.fn(() => controllerCompletion.promise),
            isDownloadCompleteWithSignatureIssues: vi.fn(() => false),
        };
        const fileDownloader = {
            getClaimedSizeInBytes: vi.fn(() => nodeSize),
            downloadToStream: vi.fn((_writable: unknown, onProgress: (bytes: number) => void) => {
                onProgress(64);
                return controller;
            }),
        };

        sdkMock.driveMock.getFileDownloader.mockResolvedValue(fileDownloader);

        const readableStream = {
            cancel: vi.fn(),
            locked: false,
        } as unknown as ReadableStream<Uint8Array<ArrayBuffer>>;
        loadCreateReadableStreamWrapperMock.mockResolvedValue(readableStream);

        const saveDeferred = createDeferred<void>();
        fileSaverSaveAsFileMock.mockReturnValue(saveDeferred.promise);

        await manager.download([node.uid]);

        expect(storeMockState.addDownloadItem).toHaveBeenCalledWith({
            name: getNodeName(node),
            storageSize: nodeSize,
            downloadedBytes: 0,
            status: DownloadStatus.Pending,
            nodeUids: [node.uid],
            unsupportedFileDetected: undefined,
            isPhoto: false,
        });

        expect(sdkMock.driveMock.onMessage).toHaveBeenCalledTimes(2);

        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);
        const scheduledTask = schedulerInstance.scheduleDownload.mock.calls[0][0];
        expect(scheduledTask.node).toEqual(node);

        const completionPromise = scheduledTask.start();
        await flushAsync();

        const activeDownloads = Reflect.get(manager, 'activeDownloads') as Map<string, unknown>;
        expect(storeMockState.updateDownloadItem).toHaveBeenNthCalledWith(
            1,
            'download-1',
            expect.objectContaining({
                storageSize: nodeSize,
                status: DownloadStatus.InProgress,
            })
        );
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('download-1', { downloadedBytes: 64 });

        controllerCompletion.resolve();
        saveDeferred.resolve();

        await completionPromise;

        expect(fileSaverSaveAsFileMock).toHaveBeenCalledWith(readableStream, {
            downloadId: 'download-1',
            filename: getNodeName(node),
            mimeType: 'application/octet-stream',
            size: nodeSize,
        });

        await waitForCondition(() =>
            storeMockState.updateDownloadItem.mock.calls.some(
                ([id, update]: [string, Partial<{ status: (typeof DownloadStatus)[keyof typeof DownloadStatus] }>]) =>
                    id === 'download-1' && update.status === DownloadStatus.Finished
            )
        );
        expect(storeMockState.updateDownloadItem.mock.calls).toContainEqual([
            'download-1',
            expect.objectContaining({ status: DownloadStatus.Finished }),
        ]);
        expect(activeDownloads.has('download-1')).toBe(false);
    });

    it('should mark downloads as cancelled when an AbortError occurs', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        storeMockState.addDownloadItem.mockReturnValue('download-cancel');
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.InProgress });

        const node: NodeEntity = createMockNodeEntity({
            uid: 'file-cancel',
            name: { ok: true as const, value: 'file-cancel.txt' },
        });
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes: [node], containsSheetOrDoc: false });

        const controllerCompletion = createDeferred<void>();
        const controller = {
            pause: vi.fn(),
            resume: vi.fn(),
            completion: vi.fn(() => controllerCompletion.promise),
            isDownloadCompleteWithSignatureIssues: vi.fn(() => false),
        };
        const fileDownloader = {
            getClaimedSizeInBytes: vi.fn(() => node.activeRevision?.storageSize ?? 0),
            downloadToStream: vi.fn((_writable: unknown, onProgress: (bytes: number) => void) => {
                onProgress(32);
                return controller;
            }),
        };

        sdkMock.driveMock.getFileDownloader.mockResolvedValue(fileDownloader);

        const cancelDeferred = createDeferred<void>();
        const readableStream = {
            cancel: vi.fn(() => {
                cancelDeferred.resolve();
                return Promise.resolve();
            }),
            locked: false,
        } as unknown as ReadableStream<Uint8Array<ArrayBuffer>>;
        loadCreateReadableStreamWrapperMock.mockResolvedValue(readableStream);

        fileSaverSaveAsFileMock.mockResolvedValue(undefined);

        await manager.download([node.uid]);

        const scheduledTask = schedulerInstance.scheduleDownload.mock.calls[0][0];
        const completionPromise = scheduledTask.start();
        await flushAsync();

        controllerCompletion.reject(new AbortError('cancelled'));
        await flushAsync();
        await expect(completionPromise).rejects.toBeInstanceOf(AbortError);
        await cancelDeferred.promise;

        expect(storeMockState.updateDownloadItem.mock.calls).toContainEqual([
            'download-cancel',
            expect.objectContaining({ status: DownloadStatus.Cancelled, error: undefined }),
        ]);
        expect(readableStream.cancel).toHaveBeenCalled();
    });

    it('should stop the transfer when the browser cancels the save', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        storeMockState.addDownloadItem.mockReturnValue('download-save-cancel');
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.InProgress });

        const node: NodeEntity = createMockNodeEntity({
            uid: 'file-save-cancel',
            name: { ok: true as const, value: 'file-save-cancel.txt' },
        });
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes: [node], containsSheetOrDoc: false });

        const controllerCompletion = createDeferred<void>();
        const controller = {
            pause: vi.fn(),
            resume: vi.fn(),
            completion: vi.fn(() => controllerCompletion.promise),
            isDownloadCompleteWithSignatureIssues: vi.fn(() => false),
        };
        sdkMock.driveMock.getFileDownloader.mockResolvedValue({
            getClaimedSizeInBytes: vi.fn(() => 0),
            downloadToStream: vi.fn(() => controller),
        });
        loadCreateReadableStreamWrapperMock.mockResolvedValue({
            cancel: vi.fn().mockResolvedValue(undefined),
            locked: true,
        } as unknown as ReadableStream<Uint8Array<ArrayBuffer>>);
        fileSaverSaveAsFileMock.mockRejectedValue(new AbortError('Transfer canceled'));

        await manager.download([node.uid]);
        const scheduledTask = schedulerInstance.scheduleDownload.mock.calls[0][0];
        const completionPromise = scheduledTask.start();
        await flushAsync();

        const transferSignal: AbortSignal = sdkMock.driveMock.getFileDownloader.mock.calls[0][1];
        await waitForCondition(() => fileSaverSaveAsFileMock.mock.calls.length > 0);
        await flushAsync();
        expect(transferSignal.aborted).toBe(true);

        controllerCompletion.reject(new AbortError('cancelled'));
        await expect(completionPromise).rejects.toBeInstanceOf(AbortError);
    });

    it('should mark a single file download as failed when the SDK throws', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        storeMockState.addDownloadItem.mockReturnValue('download-1');

        const node: NodeEntity = createMockNodeEntity({
            uid: 'file-2',
            name: { ok: true as const, value: 'broken.txt' },
        });
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes: [node], containsSheetOrDoc: false });

        const failure = new Error('sdk failure');
        sdkMock.driveMock.getFileDownloader.mockRejectedValue(failure);

        await manager.download([node.uid]);
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

        const node: NodeEntity = createMockNodeEntity({
            uid: 'file-retry',
            name: { ok: true as const, value: 'retry-me.txt' },
        });
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes: [node], containsSheetOrDoc: false });

        storeMockState.addDownloadItem.mockReturnValue('download-retry');

        await manager.download([node.uid]);

        expect(storeMockState.addDownloadItem).toHaveBeenCalledTimes(1);
        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);

        schedulerInstance.scheduleDownload.mockClear();
        storeMockState.addDownloadItem.mockClear();
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.Failed });

        manager.retry(['download-retry']);

        expect(storeMockState.addDownloadItem).not.toHaveBeenCalled();
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith(
            'download-retry',
            expect.objectContaining({ downloadedBytes: 0 })
        );
        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);
        const retriedTask = schedulerInstance.scheduleDownload.mock.calls[0][0];
        expect(retriedTask.node).toEqual(node);
    });

    it('should reuse existing queue items when retrying an archive download', async () => {
        const manager = DownloadManager.getInstance();

        const nodes: NodeEntity[] = [
            createMockNodeEntity({ uid: 'file-a', name: { ok: true as const, value: 'a.txt' } }),
            createMockNodeEntity({ uid: 'file-b', name: { ok: true as const, value: 'b.txt' } }),
        ];
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes, containsSheetOrDoc: false });

        storeMockState.addDownloadItem.mockReturnValue('archive-retry');
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.Failed });
        storeMockState.getQueueItem.mockReturnValueOnce(undefined);

        const iteratorMock = vi.fn().mockReturnValue(createEmptyAsyncGenerator<unknown>());
        traverseNodeStructureMock.mockReturnValue({
            nodesQueue: { iterator: iteratorMock },
            traversalCompletedPromise: Promise.resolve({
                totalEncryptedSize: 0,
                containsUnsupportedFile: false,
            }),
            parentPathByUid: new Map(nodes.map((node) => [node.uid, []])),
        });

        fileSaverSaveAsFileMock.mockResolvedValue(undefined);
        archiveGeneratorTracker.setFactory(() => ({
            stream: createClosedReadableStream(),
            writeLinks: vi.fn().mockResolvedValue(undefined),
            cancel: vi.fn(),
        }));

        await manager.download(nodes.map((node) => node.uid));

        expect(storeMockState.addDownloadItem).toHaveBeenCalledTimes(1);
        expect(traverseNodeStructureMock).toHaveBeenCalledTimes(1);
        expect(traverseNodeStructureMock.mock.calls[0][0]).toEqual(nodes);
        expect(archiveStreamGeneratorTracker.instances).toHaveLength(1);

        manager.retry(['archive-retry']);
        await flushAsync();

        expect(storeMockState.addDownloadItem).toHaveBeenCalledTimes(1);
        expect(traverseNodeStructureMock).toHaveBeenCalledTimes(2);
        expect(traverseNodeStructureMock.mock.calls[1][0]).toEqual(nodes);
        expect(archiveStreamGeneratorTracker.instances).toHaveLength(2);

        archiveGeneratorTracker.restoreFactory();
    });

    describe('archive save size', () => {
        const nodes: NodeEntity[] = [
            createMockNodeEntity({
                uid: 'folder',
                name: { ok: true as const, value: 'folder' },
                type: NodeType.Folder,
                activeRevision: undefined,
            }),
            createMockNodeEntity({ uid: 'file', name: { ok: true as const, value: 'a.txt' } }),
        ];
        const planEntriesMock = vi.fn().mockReturnValue(4321);

        const startArchiveDownload = async () => {
            const manager = DownloadManager.getInstance();
            storeMockState.addDownloadItem.mockReturnValue('archive-size');
            storeMockState.getQueueItem.mockReturnValue(undefined);
            hydrateAndCheckNodesMock.mockResolvedValue({ nodes, containsSheetOrDoc: false });
            traverseNodeStructureMock.mockReturnValue({
                nodesQueue: { iterator: vi.fn().mockReturnValue(createEmptyAsyncGenerator<unknown>()) },
                traversalCompletedPromise: Promise.resolve({
                    totalEncryptedSize: 5000,
                    containsUnsupportedFile: false,
                    nodes,
                }),
                parentPathByUid: new Map([
                    ['folder', []],
                    ['file', ['folder']],
                ]),
            });
            fileSaverSaveAsFileMock.mockResolvedValue(undefined);
            archiveGeneratorTracker.setFactory(() => ({
                stream: createClosedReadableStream(),
                writeLinks: vi.fn().mockResolvedValue(undefined),
                cancel: vi.fn(),
                planEntries: planEntriesMock,
            }));

            await manager.download(nodes.map((node) => node.uid));
            await waitForCondition(() => fileSaverSaveAsFileMock.mock.calls.length > 0);
            archiveGeneratorTracker.restoreFactory();
        };

        afterEach(() => {
            isIosMock.mockReturnValue(false);
        });

        it('should save with the predicted archive length on iOS', async () => {
            isIosMock.mockReturnValue(true);

            await startArchiveDownload();

            expect(planEntriesMock).toHaveBeenCalledWith([
                { uid: 'folder', isFile: false, name: 'folder', parentPath: [], size: undefined },
                {
                    uid: 'file',
                    isFile: true,
                    name: 'a.txt',
                    parentPath: ['folder'],
                    size: nodes[1].activeRevision?.claimedSize,
                },
            ]);
            expect(fileSaverSaveAsFileMock).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ size: 4321 })
            );
            expect(getArchiveStreamGeneratorInstance().constructorArgs[0]).toMatchObject({
                startEntriesInOrder: true,
            });
        });

        it('should not predict the archive length outside of iOS', async () => {
            await startArchiveDownload();

            expect(planEntriesMock).not.toHaveBeenCalled();
            expect(getArchiveStreamGeneratorInstance().constructorArgs[0]).toMatchObject({
                startEntriesInOrder: false,
            });
        });
    });

    it('should start archive downloads for multiple nodes and finalize on completion', async () => {
        const manager = DownloadManager.getInstance();

        storeMockState.addDownloadItem.mockReturnValue('archive-id');
        storeMockState.getQueueItem.mockReturnValue(undefined);

        const nodes: NodeEntity[] = [
            createMockNodeEntity({
                uid: 'folder-1',
                name: { ok: true as const, value: 'folder' },
                type: NodeType.Folder,
                activeRevision: undefined,
            }),
            createMockNodeEntity({ uid: 'file-3', name: { ok: true as const, value: 'photo.jpg' } }),
        ];
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes, containsSheetOrDoc: false });

        const iteratorMock = vi.fn().mockReturnValue(createEmptyAsyncGenerator<unknown>());
        const traversalDeferred = createDeferred<{
            totalSize: number;
            containsUnsupportedFile: boolean;
        }>();
        const parentPathByUid = new Map(nodes.map((node) => [node.uid, []]));
        traverseNodeStructureMock.mockReturnValue({
            nodesQueue: { iterator: iteratorMock },
            traversalCompletedPromise: traversalDeferred.promise.then(({ totalSize, containsUnsupportedFile }) => ({
                totalEncryptedSize: totalSize,
                containsUnsupportedFile,
            })),
            parentPathByUid,
        });

        const writeLinksDeferred = createDeferred<void>();
        archiveGeneratorTracker.setFactory(() => ({
            stream: createClosedReadableStream(),
            writeLinks: vi.fn().mockReturnValue(writeLinksDeferred.promise),
            cancel: vi.fn(),
        }));

        const saveDeferred = createDeferred<void>();
        fileSaverSaveAsFileMock.mockReturnValue(saveDeferred.promise);

        await manager.download(nodes.map((node) => node.uid));

        expect(traverseNodeStructureMock).toHaveBeenCalled();
        const traversalArgs = traverseNodeStructureMock.mock.calls[0];
        expect(traversalArgs[0]).toEqual(nodes);
        expect(traversalArgs[1]).toHaveProperty('aborted', false);

        expect(archiveStreamGeneratorTracker.instances).toHaveLength(1);

        traversalDeferred.resolve({
            totalSize: 4096,
            containsUnsupportedFile: false,
        });
        await flushAsync();

        const archiveInstance = getArchiveStreamGeneratorInstance();
        const constructorParams = archiveInstance.constructorArgs[0] as {
            entries: AsyncIterable<NodeEntity>;
            onProgress: (downloadedBytes: number) => void;
            scheduler: unknown;
            parentPathByUid: Map<string, string[]>;
        };
        expect(constructorParams.entries).toBe(iteratorMock.mock.results[0].value);
        expect(constructorParams.scheduler).toBe(getSchedulerInstance());
        expect(constructorParams.parentPathByUid).toBe(parentPathByUid);

        const { onProgress } = constructorParams;
        onProgress(512);
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('archive-id', { downloadedBytes: 512 });

        const archiveGeneratorInstance = getArchiveGeneratorInstance();
        expect(archiveGeneratorInstance.writeLinks).toHaveBeenCalledWith(archiveInstance.generator);

        const activeDownloads = Reflect.get(manager, 'activeDownloads') as Map<
            string,
            { completionPromise?: Promise<void> }
        >;
        expect(activeDownloads.has('archive-id')).toBe(true);
        const activeDownload = activeDownloads.get('archive-id');

        writeLinksDeferred.resolve();
        saveDeferred.resolve();
        await flushAsync(2);

        await activeDownload?.completionPromise;

        expect(storeMockState.updateDownloadItem.mock.calls).toContainEqual([
            'archive-id',
            expect.objectContaining({ status: DownloadStatus.Finished }),
        ]);
        await waitForCondition(() => !activeDownloads.has('archive-id'));

        archiveGeneratorTracker.restoreFactory();
    });

    it('should defer archive saving until first item is available', async () => {
        const manager = DownloadManager.getInstance();
        storeMockState.addDownloadItem.mockReturnValue('archive-delay');
        storeMockState.getQueueItem.mockReturnValue(undefined);

        const nodes: NodeEntity[] = [
            createMockNodeEntity({ uid: 'file-1', name: { ok: true as const, value: 'first.txt' } }),
            createMockNodeEntity({ uid: 'file-2', name: { ok: true as const, value: 'second.txt' } }),
        ];
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes, containsSheetOrDoc: false });

        const iteratorMock = vi.fn().mockReturnValue(createEmptyAsyncGenerator<unknown>());
        traverseNodeStructureMock.mockReturnValue({
            nodesQueue: { iterator: iteratorMock },
            traversalCompletedPromise: Promise.resolve({
                totalEncryptedSize: 0,
                containsUnsupportedFile: false,
            }),
            parentPathByUid: new Map(nodes.map((node) => [node.uid, []])),
        });

        const waitDeferred = createDeferred<void>();
        archiveStreamGeneratorTracker.setFactory((...args: unknown[]) => ({
            constructorArgs: args,
            controller: {
                pause: vi.fn(),
                resume: vi.fn(),
                completion: vi.fn().mockResolvedValue(undefined),
            },
            generator: createEmptyAsyncGenerator<unknown>(),
            waitForFirstItem: vi.fn(() => waitDeferred.promise),
        }));

        archiveGeneratorTracker.setFactory(() => ({
            stream: createClosedReadableStream(),
            writeLinks: vi.fn().mockResolvedValue(undefined),
            cancel: vi.fn(),
        }));

        fileSaverSaveAsFileMock.mockResolvedValue(undefined);

        await manager.download(nodes.map((node) => node.uid));
        await flushAsync();

        const archiveGenInstance = getArchiveGeneratorInstance();
        expect(archiveGenInstance.writeLinks).not.toHaveBeenCalled();

        waitDeferred.resolve();
        await flushAsync();

        expect(archiveGenInstance.writeLinks).toHaveBeenCalled();

        archiveStreamGeneratorTracker.restoreFactory();
        archiveGeneratorTracker.restoreFactory();
    });

    it('should pause active downloads and update their status', () => {
        const manager = DownloadManager.getInstance();
        const activeDownload = {
            controller: { pause: vi.fn(), resume: vi.fn(), completion: vi.fn() },
            abortController: { abort: vi.fn() },
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
            controller: { pause: vi.fn(), resume: vi.fn(), completion: vi.fn() },
            abortController: { abort: vi.fn() },
        };
        Reflect.set(manager, 'activeDownloads', new Map([['job-2', activeDownload]]));
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.Paused });

        manager.resume(['job-2']);

        expect(activeDownload.controller.resume).toHaveBeenCalled();
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('job-2', {
            status: DownloadStatus.InProgress,
        });
    });

    it('should keep an archive download cancelled when its traversal completes after the cancel', async () => {
        const manager = DownloadManager.getInstance();
        storeMockState.addDownloadItem.mockReturnValue('archive-cancelled');
        storeMockState.getQueueItem.mockReturnValue(undefined);

        const nodes: NodeEntity[] = [
            createMockNodeEntity({
                uid: 'folder-1',
                name: { ok: true as const, value: 'folder' },
                type: NodeType.Folder,
                activeRevision: undefined,
            }),
        ];
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes, containsSheetOrDoc: false });
        const traversalDeferred = createDeferred<{ totalEncryptedSize: number; containsUnsupportedFile: boolean }>();
        traverseNodeStructureMock.mockReturnValue({
            nodesQueue: { iterator: vi.fn().mockReturnValue(createEmptyAsyncGenerator<unknown>()) },
            traversalCompletedPromise: traversalDeferred.promise,
            parentPathByUid: new Map(),
        });
        archiveGeneratorTracker.setFactory(() => ({
            stream: createClosedReadableStream(),
            writeLinks: vi.fn().mockReturnValue(createDeferred<void>().promise),
            cancel: vi.fn(),
        }));
        fileSaverSaveAsFileMock.mockReturnValue(createDeferred<void>().promise);

        await manager.download(nodes.map((node) => node.uid));
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.Preparing });
        await manager.cancel(['archive-cancelled']);
        storeMockState.updateDownloadItem.mockClear();

        // The traversal of a big folder can end after the user cancelled.
        traversalDeferred.resolve({ totalEncryptedSize: 4096, containsUnsupportedFile: false });
        await flushAsync();

        expect(storeMockState.updateDownloadItem).not.toHaveBeenCalledWith(
            'archive-cancelled',
            expect.objectContaining({ status: DownloadStatus.InProgress })
        );

        archiveGeneratorTracker.restoreFactory();
    });

    it('should cancel downloads by aborting controllers and marking them cancelled', async () => {
        const manager = DownloadManager.getInstance();
        const abortMock = vi.fn();
        const activeDownload = {
            controller: { pause: vi.fn(), resume: vi.fn(), completion: vi.fn() },
            abortController: { abort: abortMock },
        };
        Reflect.set(manager, 'activeDownloads', new Map([['job-3', activeDownload]]));
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.InProgress });

        await manager.cancel(['job-3']);

        expect(abortMock).toHaveBeenCalled();
        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('job-3', {
            status: DownloadStatus.Cancelled,
        });
    });

    it('should abort the download when cancel is called while the file is actively downloading', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        storeMockState.addDownloadItem.mockReturnValue('download-cancel-active');
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.InProgress });

        const node: NodeEntity = createMockNodeEntity({
            uid: 'file-cancel-active',
            name: { ok: true as const, value: 'active.txt' },
        });
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes: [node], containsSheetOrDoc: false });

        const controllerCompletion = createDeferred<void>();
        const controller = {
            pause: vi.fn(),
            resume: vi.fn(),
            completion: vi.fn(() => controllerCompletion.promise),
            isDownloadCompleteWithSignatureIssues: vi.fn(() => false),
        };
        const fileDownloader = {
            getClaimedSizeInBytes: vi.fn(() => node.activeRevision?.storageSize ?? 0),
            downloadToStream: vi.fn(() => controller),
        };
        sdkMock.driveMock.getFileDownloader.mockResolvedValue(fileDownloader);

        const readableStream = {
            cancel: vi.fn().mockResolvedValue(undefined),
            locked: false,
        } as unknown as ReadableStream<Uint8Array<ArrayBuffer>>;
        loadCreateReadableStreamWrapperMock.mockResolvedValue(readableStream);
        fileSaverSaveAsFileMock.mockResolvedValue(undefined);

        await manager.download([node.uid]);

        const scheduledTask = schedulerInstance.scheduleDownload.mock.calls[0][0];
        const completionPromise = scheduledTask.start();

        // Wait for startSingleFileDownload to reach attachActiveDownload so the download is registered
        await flushAsync();

        const activeDownloads = Reflect.get(manager, 'activeDownloads') as Map<string, unknown>;
        expect(activeDownloads.has('download-cancel-active')).toBe(true);

        await manager.cancel(['download-cancel-active']);

        expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith(
            'download-cancel-active',
            expect.objectContaining({ status: DownloadStatus.Cancelled })
        );
        controllerCompletion.reject(new AbortError('Transfer download-cancel-active canceled'));
        await expect(completionPromise).rejects.toBeInstanceOf(AbortError);

        // activeDownloads is cleaned up in .finally() after the abort settles
        expect(activeDownloads.has('download-cancel-active')).toBe(false);
    });

    it('should not overwrite status with Cancelled when retry is called before stale completion promise settles', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        storeMockState.addDownloadItem.mockReturnValue('download-race');

        const node: NodeEntity = createMockNodeEntity({
            uid: 'file-race',
            name: { ok: true as const, value: 'race.txt' },
        });
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes: [node], containsSheetOrDoc: false });

        const controllerCompletion = createDeferred<void>();
        const controller = {
            pause: vi.fn(),
            resume: vi.fn(),
            completion: vi.fn(() => controllerCompletion.promise),
            isDownloadCompleteWithSignatureIssues: vi.fn(() => false),
        };
        const fileDownloader = {
            getClaimedSizeInBytes: vi.fn(() => node.activeRevision?.storageSize ?? 0),
            downloadToStream: vi.fn(() => controller),
        };
        sdkMock.driveMock.getFileDownloader.mockResolvedValue(fileDownloader);

        const readableStream = {
            cancel: vi.fn().mockResolvedValue(undefined),
            locked: false,
        } as unknown as ReadableStream<Uint8Array<ArrayBuffer>>;
        loadCreateReadableStreamWrapperMock.mockResolvedValue(readableStream);
        fileSaverSaveAsFileMock.mockResolvedValue(undefined);

        // Start the download and wait for it to register as active
        await manager.download([node.uid]);
        const scheduledTask = schedulerInstance.scheduleDownload.mock.calls[0][0];
        const completionPromise = scheduledTask.start();
        await flushAsync();

        // Cancel while InProgress — synchronously marks as Cancelled
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.InProgress });
        await manager.cancel(['download-race']);

        // Before the old completion promise settles, immediately retry
        // (simulates the user clicking retry quickly right after cancel)
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.Cancelled });
        manager.retry(['download-race']);

        // Simulate the abort propagating through the stream asynchronously.
        // At this point the store shows Pending with isRetried:true (as retry() sets it).
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.Pending, isRetried: true });
        controllerCompletion.reject(new AbortError('Transfer download-race canceled'));
        await expect(completionPromise).rejects.toBeInstanceOf(AbortError);
        await flushAsync(5);

        // The stale onError must NOT overwrite the Pending status back to Cancelled.
        // The only Cancelled update should be the one issued directly by manager.cancel().
        const cancelStatusUpdates = storeMockState.updateDownloadItem.mock.calls.filter(
            ([id, update]: [string, { status?: string }]) =>
                id === 'download-race' && update.status === DownloadStatus.Cancelled
        );
        expect(cancelStatusUpdates).toHaveLength(1);

        // The stale .finally() must not delete a new activeDownload entry registered by retry.
        // Since the scheduler mock doesn't start the new download automatically, the old entry
        // is cleaned up (expected), but a real scenario would keep the new entry intact.
        const activeDownloads = Reflect.get(manager, 'activeDownloads') as Map<string, unknown>;
        expect(activeDownloads.has('download-race')).toBe(false);
    });

    it('should clear active downloads, scheduler, and queue', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();
        const abortMock = vi.fn();
        const activeDownload = {
            controller: { pause: vi.fn(), resume: vi.fn(), completion: vi.fn() },
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
        const cancelSpy = vi.spyOn(manager, 'cancel').mockImplementation(async () => undefined);
        const resumeSpy = vi.spyOn(manager, 'resume').mockImplementation(async () => undefined);

        manager.resolveMalwareDetection('job-6', MalwareDownloadResolution.CancelDownload);
        expect(cancelSpy).toHaveBeenCalledWith(['job-6']);

        manager.resolveMalwareDetection('job-6', MalwareDownloadResolution.ContinueDownload);
        expect(resumeSpy).toHaveBeenCalledWith(['job-6']);
    });

    it('should download from buffer and add to download queue', async () => {
        const manager = DownloadManager.getInstance();
        storeMockState.addDownloadItem.mockReturnValue('buffer-download');

        const node: NodeEntity = createMockNodeEntity({
            uid: 'buffer-file-1',
            name: { ok: true as const, value: 'video.mp4' },
        });
        const nodeSize = node.activeRevision?.storageSize ?? 0;

        const buffer: Uint8Array<ArrayBuffer>[] = [new Uint8Array([1, 2, 3, 4])];
        const mimeType = 'video/mp4';

        fileSaverSaveAsFileMock.mockResolvedValue(undefined);

        await manager.downloadFromBuffer(node, buffer, mimeType);

        expect(fileSaverSaveAsFileMock).toHaveBeenCalledWith(expect.any(ReadableStream), {
            downloadId: 'buffer-download',
            filename: getNodeName(node),
            mimeType,
            size: nodeSize,
        });

        expect(storeMockState.addDownloadItem).toHaveBeenCalledWith({
            name: getNodeName(node),
            storageSize: nodeSize,
            status: DownloadStatus.Finished,
            nodeUids: [node.uid],
            downloadedBytes: nodeSize,
            isPhoto: false,
        });
    });

    it('should subscribe to SDK events once and update status on pause/resume', () => {
        const manager = DownloadManager.getInstance();
        const activeDownload = {
            controller: { pause: vi.fn(), resume: vi.fn(), completion: vi.fn() },
            abortController: { abort: vi.fn() },
        };
        Reflect.set(manager, 'activeDownloads', new Map([['job-7', activeDownload]]));

        let currentStatus = DownloadStatus.InProgress;
        storeMockState.getQueueItem.mockImplementation(() => ({ status: currentStatus }));

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

    it('should use drivePhotosClient when downloading photos', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        storeMockState.addDownloadItem.mockReturnValue('photo-download-1');
        storeMockState.getQueueItem.mockReturnValue({ isPhoto: true });

        const node: NodeEntity = createMockNodeEntity({
            uid: 'photo-1',
            name: { ok: true as const, value: 'photo.jpg' },
            type: NodeType.Photo,
        });
        const nodeSize = node.activeRevision?.storageSize ?? 0;
        hydrateAndCheckPhotosMock.mockResolvedValue({ nodes: [node] });

        const controllerCompletion = createDeferred<void>();
        const controller = {
            pause: vi.fn(),
            resume: vi.fn(),
            completion: vi.fn(() => controllerCompletion.promise),
            isDownloadCompleteWithSignatureIssues: vi.fn(() => false),
        };
        const fileDownloader = {
            getClaimedSizeInBytes: vi.fn(() => nodeSize),
            downloadToStream: vi.fn(() => controller),
        };

        const mockDrivePhotosClient = {
            ...sdkMock.driveMock,
            getFileDownloader: vi.fn().mockResolvedValue(fileDownloader),
            onMessage: vi.fn(),
        };
        DownloadDriveClientRegistry.setDrivePhotosClient(mockDrivePhotosClient as unknown as ProtonDrivePhotosClient);

        getDownloadSdkMock.mockReturnValue(mockDrivePhotosClient);

        const readableStream = {} as ReadableStream<Uint8Array<ArrayBuffer>>;
        loadCreateReadableStreamWrapperMock.mockResolvedValue(readableStream);
        fileSaverSaveAsFileMock.mockResolvedValue(undefined);

        await manager.downloadPhotos([node.uid]);

        expect(hydrateAndCheckPhotosMock).toHaveBeenCalledWith([node.uid]);
        expect(mockDrivePhotosClient.onMessage).toHaveBeenCalledTimes(2);
        expect(sdkMock.driveMock.onMessage).not.toHaveBeenCalled();
        expect(storeMockState.addDownloadItem).toHaveBeenCalledWith({
            name: getNodeName(node),
            storageSize: nodeSize,
            downloadedBytes: 0,
            status: DownloadStatus.Pending,
            nodeUids: [node.uid],
            isPhoto: true,
        });

        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);
        const scheduledTask = schedulerInstance.scheduleDownload.mock.calls[0][0];

        const completionPromise = scheduledTask.start();
        await flushAsync();

        expect(getDownloadSdkMock).toHaveBeenCalledWith('photo-download-1');
        expect(mockDrivePhotosClient.getFileDownloader).toHaveBeenCalledWith(node.uid, expect.any(Object));

        controllerCompletion.resolve();
        await completionPromise;
    });

    it('should download a file revision using getFileRevisionDownloader', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        storeMockState.addDownloadItem.mockReturnValue('revision-download-1');

        const node: NodeEntity = createMockNodeEntity({
            uid: 'file-1',
            name: { ok: true as const, value: 'file.txt' },
        });
        const nodeSize = node.activeRevision?.storageSize ?? 0;
        const revisionUid = 'revision-123';
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes: [node], containsSheetOrDoc: false });

        const controllerCompletion = createDeferred<void>();
        const controller = {
            pause: vi.fn(),
            resume: vi.fn(),
            completion: vi.fn(() => controllerCompletion.promise),
            isDownloadCompleteWithSignatureIssues: vi.fn(() => false),
        };
        const fileDownloader = {
            getClaimedSizeInBytes: vi.fn(() => nodeSize),
            downloadToStream: vi.fn((_writable: unknown, onProgress: (bytes: number) => void) => {
                onProgress(64);
                return controller;
            }),
        };

        const mockDriveClient = {
            ...sdkMock.driveMock,
            getFileRevisionDownloader: vi.fn().mockResolvedValue(fileDownloader),
        };
        getDownloadSdkMock.mockReturnValue(mockDriveClient);

        storeMockState.getQueueItem.mockReturnValue({ revisionUid });

        const readableStream = {
            cancel: vi.fn(),
            locked: false,
        } as unknown as ReadableStream<Uint8Array<ArrayBuffer>>;
        loadCreateReadableStreamWrapperMock.mockResolvedValue(readableStream);

        const saveDeferred = createDeferred<void>();
        fileSaverSaveAsFileMock.mockReturnValue(saveDeferred.promise);

        await manager.downloadRevision(node.uid, revisionUid);

        expect(storeMockState.addDownloadItem).toHaveBeenCalledWith({
            name: getNodeName(node),
            storageSize: nodeSize,
            downloadedBytes: 0,
            status: DownloadStatus.Pending,
            nodeUids: [node.uid],
            revisionUid,
            unsupportedFileDetected: undefined,
            isPhoto: false,
        });

        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);
        const scheduledTask = schedulerInstance.scheduleDownload.mock.calls[0][0];

        const completionPromise = scheduledTask.start();
        await flushAsync();

        expect(mockDriveClient.getFileRevisionDownloader).toHaveBeenCalledWith(revisionUid, expect.any(Object));
        expect(mockDriveClient.getFileDownloader).not.toHaveBeenCalled();

        controllerCompletion.resolve();
        saveDeferred.resolve();

        await completionPromise;
    });

    it('should fallback to getFileDownloader when client does not support revision downloads', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        storeMockState.addDownloadItem.mockReturnValue('fallback-download-1');

        const node: NodeEntity = createMockNodeEntity({
            uid: 'file-1',
            name: { ok: true as const, value: 'file.txt' },
        });
        const nodeSize = node.activeRevision?.storageSize ?? 0;
        const revisionUid = 'revision-456';
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes: [node], containsSheetOrDoc: false });

        const controllerCompletion = createDeferred<void>();
        const controller = {
            pause: vi.fn(),
            resume: vi.fn(),
            completion: vi.fn(() => controllerCompletion.promise),
            isDownloadCompleteWithSignatureIssues: vi.fn(() => false),
        };
        const fileDownloader = {
            getClaimedSizeInBytes: vi.fn(() => nodeSize),
            downloadToStream: vi.fn(() => controller),
        };

        const mockPublicClient = {
            ...sdkMock.driveMock,
            getFileDownloader: vi.fn().mockResolvedValue(fileDownloader),
        };
        getDownloadSdkMock.mockReturnValue(mockPublicClient);

        storeMockState.getQueueItem.mockReturnValue({ revisionUid });

        const readableStream = {
            cancel: vi.fn(),
            locked: false,
        } as unknown as ReadableStream<Uint8Array<ArrayBuffer>>;
        loadCreateReadableStreamWrapperMock.mockResolvedValue(readableStream);

        const saveDeferred = createDeferred<void>();
        fileSaverSaveAsFileMock.mockReturnValue(saveDeferred.promise);

        await manager.downloadRevision(node.uid, revisionUid);

        const scheduledTask = schedulerInstance.scheduleDownload.mock.calls[0][0];
        const completionPromise = scheduledTask.start();
        await flushAsync();

        expect(mockPublicClient.getFileDownloader).toHaveBeenCalledWith(node.uid, expect.any(Object));

        controllerCompletion.resolve();
        saveDeferred.resolve();

        await completionPromise;
    });

    it('should retry a revision download with revisionUid preserved', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        const node: NodeEntity = createMockNodeEntity({
            uid: 'file-retry-revision',
            name: { ok: true as const, value: 'retry-revision.txt' },
        });
        const revisionUid = 'revision-789';
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes: [node], containsSheetOrDoc: false });

        storeMockState.addDownloadItem.mockReturnValue('download-retry-revision');

        await manager.downloadRevision(node.uid, revisionUid);

        expect(storeMockState.addDownloadItem).toHaveBeenCalledTimes(1);
        expect(storeMockState.addDownloadItem).toHaveBeenCalledWith(
            expect.objectContaining({
                revisionUid,
            })
        );
        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);

        schedulerInstance.scheduleDownload.mockClear();
        storeMockState.addDownloadItem.mockClear();
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.Failed, revisionUid });

        manager.retry(['download-retry-revision']);

        expect(storeMockState.addDownloadItem).not.toHaveBeenCalled();
        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);
        const retriedTask = schedulerInstance.scheduleDownload.mock.calls[0][0];
        expect(retriedTask.node).toEqual(node);
    });

    describe('signature issues', () => {
        const setupSignatureTest = () => {
            const manager = DownloadManager.getInstance();
            const schedulerInstance = getSchedulerInstance();
            storeMockState.addDownloadItem.mockReturnValue('download-1');

            const node: NodeEntity = createMockNodeEntity({
                uid: 'file-1',
                name: { ok: true as const, value: 'signed.txt' },
            });
            const nodeSize = node.activeRevision?.storageSize ?? 0;
            hydrateAndCheckNodesMock.mockResolvedValue({ nodes: [node], containsSheetOrDoc: false });

            const controllerCompletion = createDeferred<void>();
            sdkMock.driveMock.getFileDownloader.mockResolvedValue({
                getClaimedSizeInBytes: vi.fn(),
                downloadToStream: vi.fn(() => ({
                    completion: vi.fn(() => controllerCompletion.promise),
                    isDownloadCompleteWithSignatureIssues: vi.fn(() => true),
                })),
            });

            const saveDeferred = createDeferred<void>();
            fileSaverSaveAsFileMock.mockReturnValue(saveDeferred.promise);

            return { manager, schedulerInstance, nodeSize, controllerCompletion, saveDeferred };
        };

        /** Queue the download and start the scheduled task */
        const startSignatureDownload = async (setup: ReturnType<typeof setupSignatureTest>) => {
            await setup.manager.download(['file-1']);
            const scheduledTask = setup.schedulerInstance.scheduleDownload.mock.calls[0][0];
            const completionPromise: Promise<void> = scheduledTask.start();
            await flushAsync();
            // Return wrapped — async functions chain bare promises, which would block the caller
            return { completionPromise };
        };

        it('should complete download when user approves a signature issue', async () => {
            const setup = setupSignatureTest();
            addAndWaitForManifestIssueDecisionMock.mockResolvedValue(IssueStatus.Approved);

            const { completionPromise } = await startSignatureDownload(setup);

            setup.controllerCompletion.reject(new Error('Signature verification failed'));
            setup.saveDeferred.resolve();

            await completionPromise;

            expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith(
                'download-1',
                expect.objectContaining({ status: DownloadStatus.Finished, downloadedBytes: setup.nodeSize })
            );
        });

        it('should cancel download when user rejects a signature issue', async () => {
            const setup = setupSignatureTest();
            addAndWaitForManifestIssueDecisionMock.mockResolvedValue(IssueStatus.Rejected);

            const { completionPromise } = await startSignatureDownload(setup);

            setup.controllerCompletion.reject(new Error('Signature verification failed'));
            setup.saveDeferred.reject(new AbortError('Transfer download-1 canceled'));

            await expect(completionPromise).rejects.toThrow();

            expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith(
                'download-1',
                expect.objectContaining({ status: DownloadStatus.Cancelled })
            );
        });

        it('should keep download in activeDownloads while waiting for signature decision', async () => {
            const setup = setupSignatureTest();
            const signatureDecision = createDeferred<typeof IssueStatus.Approved>();
            addAndWaitForManifestIssueDecisionMock.mockReturnValue(signatureDecision.promise);

            await startSignatureDownload(setup);

            setup.controllerCompletion.reject(new Error('Signature verification failed'));

            const activeDownloads = Reflect.get(setup.manager, 'activeDownloads') as Map<string, unknown>;
            await waitForCondition(() => activeDownloads.has('download-1'));

            signatureDecision.resolve(IssueStatus.Approved);
            setup.saveDeferred.resolve();
            await waitForCondition(() => !activeDownloads.has('download-1'));
        });
    });

    it('should cancel pending downloads correctly', async () => {
        const manager = DownloadManager.getInstance();
        const schedulerInstance = getSchedulerInstance();

        storeMockState.addDownloadItem.mockReturnValue('download-pending-cancel');

        const node: NodeEntity = createMockNodeEntity({
            uid: 'file-pending',
            name: { ok: true as const, value: 'pending.txt' },
        });
        hydrateAndCheckNodesMock.mockResolvedValue({ nodes: [node], containsSheetOrDoc: false });

        // Block createFileDownloadStream so the download stays pending (not in activeDownloads)
        const fileDownloaderDeferred = createDeferred<unknown>();
        sdkMock.driveMock.getFileDownloader.mockReturnValue(fileDownloaderDeferred.promise);

        await manager.download([node.uid]);
        const scheduledTask = schedulerInstance.scheduleDownload.mock.calls[0][0];
        const taskPromise = scheduledTask.start();
        await flushAsync();

        // Verify we have both active and pending downloads
        const activeDownloads = Reflect.get(manager, 'activeDownloads') as Map<string, unknown>;
        const pendingAbortControllers = Reflect.get(manager, 'pendingAbortControllers') as Map<string, unknown>;
        expect(activeDownloads.has('download-pending-cancel')).toBe(false);
        expect(pendingAbortControllers.has('download-pending-cancel')).toBe(true);

        // Check they are not marked as failed after cancellation
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.Pending });
        await manager.cancel(['download-pending-cancel']);
        storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.Cancelled });
        fileDownloaderDeferred.reject();
        await taskPromise.catch(() => {});
        await flushAsync(5);
        const failedCalls = storeMockState.updateDownloadItem.mock.calls.filter(
            ([id, update]: [string, { status?: string }]) =>
                id === 'download-pending-cancel' && update.status === DownloadStatus.Failed
        );
        expect(failedCalls).toHaveLength(0);
    });

    describe('downloadAlbum', () => {
        it('creates the item as Preparing immediately and schedules the album traversal', async () => {
            const manager = DownloadManager.getInstance();

            storeMockState.addDownloadItem.mockReturnValue('album-download-1');
            storeMockState.getQueueItem.mockReturnValue(undefined);

            const iteratorMock = vi.fn().mockReturnValue(createEmptyAsyncGenerator<unknown>());
            traverseAlbumMock.mockReturnValue({
                nodesQueue: { iterator: iteratorMock },
                traversalCompletedPromise: Promise.resolve({
                    totalEncryptedSize: 0,
                    containsUnsupportedFile: false,
                }),
                parentPathByUid: new Map(),
            });

            await manager.downloadAlbum('album-1', 'Summer trip');
            await flushAsync();

            expect(storeMockState.addDownloadItem).toHaveBeenCalledWith(
                expect.objectContaining({ status: DownloadStatus.Preparing, name: 'Summer trip.zip' })
            );
            expect(traverseAlbumMock).toHaveBeenCalledTimes(1);
            expect(traverseAlbumMock.mock.calls[0][0]).toBe('album-1');
            expect(traverseAlbumMock.mock.calls[0][1]).toHaveProperty('aborted', false);
        });

        it('fails the whole album download when an album item is missing', async () => {
            const manager = DownloadManager.getInstance();

            storeMockState.addDownloadItem.mockReturnValue('album-download-2');
            storeMockState.getQueueItem.mockReturnValue(undefined);

            const failure = new Error("Requested item doesn't exist anymore");
            traverseAlbumMock.mockImplementation(() => {
                throw failure;
            });

            await manager.downloadAlbum('album-2', '');
            await flushAsync(3);

            expect(storeMockState.updateDownloadItem).toHaveBeenCalledWith('album-download-2', {
                status: DownloadStatus.Failed,
                error: failure,
            });
        });
    });

    describe('retry with the new requestedDownloads shapes', () => {
        it('retries an album download via scheduleArchiveDownloadForAlbum', async () => {
            const manager = DownloadManager.getInstance();

            storeMockState.addDownloadItem.mockReturnValue('retry-album');
            storeMockState.getQueueItem.mockReturnValue(undefined);

            traverseAlbumMock.mockReturnValue({
                nodesQueue: { iterator: vi.fn().mockReturnValue(createEmptyAsyncGenerator<unknown>()) },
                traversalCompletedPromise: Promise.resolve({
                    totalEncryptedSize: 0,
                    containsUnsupportedFile: false,
                }),
                parentPathByUid: new Map(),
            });

            await manager.downloadAlbum('album-retry', 'Retry album');
            await flushAsync();
            traverseAlbumMock.mockClear();

            storeMockState.getQueueItem.mockReturnValue({ status: DownloadStatus.Failed });
            manager.retry(['retry-album']);
            await flushAsync();

            expect(traverseAlbumMock).toHaveBeenCalledTimes(1);
            expect(traverseAlbumMock.mock.calls[0][0]).toBe('album-retry');
        });
    });
});
