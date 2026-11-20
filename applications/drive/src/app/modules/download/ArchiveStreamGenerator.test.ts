import { createMockNodeEntity } from '@proton/drive/modules/testing';
import { NodeType } from '@proton/drive/sdk';

import { ArchiveStreamGenerator } from './ArchiveStreamGenerator';
import { DownloadStatus, IssueStatus, useDownloadManagerStore } from './downloadManager.store';
import type { DownloadQueueTask } from './downloadTypes';
import type { MalwareDetection } from './malwareDetection/malwareDetection';
import { createDeferred, flushAsync, trackInstances, waitForCondition } from './testUtils';

const { getDownloadSdkMock, handleDownloadErrorMock } = vi.hoisted(() => ({
    getDownloadSdkMock: vi.fn(),
    handleDownloadErrorMock: vi.fn(),
}));

vi.mock('./utils/getDownloadSdk', () => ({
    getDownloadSdk: getDownloadSdkMock,
}));

vi.mock('./utils/handleError', () => ({
    handleDownloadError: handleDownloadErrorMock,
}));

const seedDownloadItem = (downloadId: string) => {
    useDownloadManagerStore.setState((state) => {
        const downloadItem = {
            downloadId,
            name: 'download',
            storageSize: 0,
            status: DownloadStatus.Pending,
            nodeUids: [],
            downloadedBytes: 0,
            lastStatusUpdateTime: new Date(),
        };
        const queue = new Map(state.queue);
        queue.set(downloadId, downloadItem);
        const queueIds = new Set(state.queueIds);
        queueIds.add(downloadId);
        return { ...state, queue, queueIds };
    });
};

const schedulerTracker = trackInstances(() => {
    const tasks: DownloadQueueTask[] = [];
    let counter = 0;
    return {
        scheduleDownload: vi.fn((task: DownloadQueueTask) => {
            tasks.push(task);
            return `task-${tasks.length}`;
        }),
        cancelTask: vi.fn(),
        cancelDownloadsById: vi.fn(),
        clearDownloads: vi.fn(),
        generateTaskId: vi.fn(() => `task-${++counter}`),
        updateDownloadProgress: vi.fn(),
        _tasks: tasks,
    };
});

const createMalwareDetectionMock = () =>
    ({
        wrapStream: vi.fn((_, __, stream) => stream),
        resolveDecision: vi.fn(),
        rejectPending: vi.fn(),
    }) as unknown as MalwareDetection;

describe('ArchiveStreamGenerator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        schedulerTracker.reset();
        getDownloadSdkMock.mockReset();
        handleDownloadErrorMock.mockReset();
        useDownloadManagerStore.getState().clearQueue();
        seedDownloadItem('download-id');
    });

    it('should schedule file entries and expose generator/controller', async () => {
        const abortController = new AbortController();
        const progressSpy = vi.fn();
        const downloadControllerDeferred = createDeferred<void>();
        const downloadController = {
            pause: vi.fn(),
            resume: vi.fn(),
            completion: vi.fn(() => downloadControllerDeferred.promise),
        };

        let progressCallback: ((bytes: number) => void) | undefined;
        const downloadToStream = vi.fn((_writable: unknown, onProgress: (bytes: number) => void) => {
            progressCallback = onProgress;
            return downloadController;
        });

        const getFileDownloader = vi.fn(async (_uid: string, _signal: AbortSignal) => ({
            downloadToStream,
            getClaimedSizeInBytes: vi.fn(() => 1024),
        }));

        getDownloadSdkMock.mockImplementation(() => ({
            getFileDownloader,
        }));

        const schedulerInstance = schedulerTracker.Mock();

        const node = createMockNodeEntity({
            uid: 'file-1',
            name: { ok: true, value: 'file.txt' },
        });

        async function* entries() {
            yield node;
        }

        const parentPaths = new Map<string, string[]>([['file-1', ['folder']]]);
        const generatorInstance = new ArchiveStreamGenerator({
            entries: entries(),
            onProgress: progressSpy,
            scheduler: schedulerInstance,
            abortController,
            parentPathByUid: parentPaths,
            downloadId: 'download-id',
            malwareDetection: createMalwareDetectionMock(),
        });

        await flushAsync();
        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);
        const scheduledTask = schedulerInstance._tasks[0];
        expect(scheduledTask.storageSizeEstimate).toBe(node.activeRevision?.storageSize ?? 0);

        const completion = scheduledTask.start();

        const { value, done } = await generatorInstance.generator.next();
        expect(done).toBe(false);
        expect(value?.isFile).toBe(true);
        expect(value?.name).toBe('file.txt');
        expect(value?.parentPath).toEqual(['folder']);
        expect(value?.claimedSize).toBe(1024);

        expect(getFileDownloader).toHaveBeenCalledWith(node.uid, abortController.signal);
        expect(downloadToStream).toHaveBeenCalledTimes(1);

        progressCallback?.(512);
        expect(progressSpy).toHaveBeenCalledWith(512, 1024);

        progressCallback?.(256);
        expect(progressSpy).toHaveBeenLastCalledWith(256, 1024);

        generatorInstance.controller.pause();
        expect(downloadController.pause).toHaveBeenCalled();

        generatorInstance.controller.resume();
        expect(downloadController.resume).toHaveBeenCalled();

        downloadControllerDeferred.resolve();
        await completion;
        await generatorInstance.controller.completion();

        const finalIteration = await generatorInstance.generator.next();
        expect(finalIteration.done).toBe(true);
    });

    it('should not fail the archive when a signature issue is approved', async () => {
        const abortController = new AbortController();
        const downloadControllerDeferred = createDeferred<void>();
        const downloadController = {
            pause: vi.fn(),
            resume: vi.fn(),
            completion: vi.fn(() => downloadControllerDeferred.promise),
            isDownloadCompleteWithSignatureIssues: vi.fn(() => true),
        };

        const downloadToStream = vi.fn(() => downloadController);
        const getFileDownloader = vi.fn(async () => ({
            downloadToStream,
            getClaimedSizeInBytes: vi.fn(() => 1024),
        }));
        getDownloadSdkMock.mockImplementation(() => ({ getFileDownloader }));

        // Pre-approving the decision lets addAndWaitForManifestIssueDecision resolve
        // immediately instead of polling for a modal decision that never comes in this test.
        useDownloadManagerStore.setState((state) => {
            const existing = state.queue.get('download-id');
            if (!existing) {
                return state;
            }
            const queue = new Map(state.queue);
            queue.set('download-id', { ...existing, signatureIssueAllDecision: IssueStatus.Approved });
            return { ...state, queue };
        });

        const schedulerInstance = schedulerTracker.Mock();
        const node = createMockNodeEntity({
            uid: 'file-signature',
            name: { ok: true, value: 'signed.txt' },
        });

        async function* entries() {
            yield node;
        }

        const generatorInstance = new ArchiveStreamGenerator({
            entries: entries(),
            onProgress: vi.fn(),
            scheduler: schedulerInstance,
            abortController,
            parentPathByUid: new Map<string, string[]>([['file-signature', []]]),
            downloadId: 'download-id',
            malwareDetection: createMalwareDetectionMock(),
        });

        await flushAsync();
        const scheduledTask = schedulerInstance._tasks[0];
        const completion = scheduledTask.start();

        const { done } = await generatorInstance.generator.next();
        expect(done).toBe(false);

        downloadControllerDeferred.reject(new Error('manifest signature mismatch'));

        await expect(completion).resolves.toBeUndefined();
        await expect(generatorInstance.controller.completion()).resolves.toBeUndefined();
    });

    it('should enqueue folder entries without accessing downloader', async () => {
        const schedulerInstance = schedulerTracker.Mock();
        getDownloadSdkMock.mockImplementation(() => ({
            getFileDownloader: vi.fn(async () => undefined),
        }));

        const folderNode = createMockNodeEntity({
            uid: 'folder-1',
            name: { ok: true, value: 'Folder' },
            type: NodeType.Folder,
        });

        async function* entries() {
            yield folderNode;
        }

        const progressSpy = vi.fn();
        const folderAbortController = new AbortController();
        const generatorInstance = new ArchiveStreamGenerator({
            entries: entries(),
            onProgress: progressSpy,
            scheduler: schedulerInstance,
            abortController: folderAbortController,
            parentPathByUid: new Map<string, string[]>([['folder-1', [] as string[]]]),
            downloadId: 'download-id',
            malwareDetection: createMalwareDetectionMock(),
        });

        await flushAsync();
        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);
        const scheduledTask = schedulerInstance._tasks[0];

        await scheduledTask.start();
        await flushAsync();

        const { value, done } = await generatorInstance.generator.next();
        expect(done).toBe(false);
        expect(value?.isFile).toBe(false);
        expect(value?.name).toBe('Folder'); // folder name from getNodeName

        const finalIteration = await generatorInstance.generator.next();
        expect(finalIteration.done).toBe(true);
        expect(progressSpy).not.toHaveBeenCalled();
    });

    describe('scheduling order', () => {
        const folders = ['folder-1', 'folder-2'].map((uid) =>
            createMockNodeEntity({ uid, name: { ok: true, value: uid }, type: NodeType.Folder })
        );

        const createGenerator = (startEntriesInOrder?: boolean) => {
            const schedulerInstance = schedulerTracker.Mock();
            async function* entries() {
                yield* folders;
            }
            new ArchiveStreamGenerator({
                entries: entries(),
                onProgress: vi.fn(),
                scheduler: schedulerInstance,
                abortController: new AbortController(),
                parentPathByUid: new Map<string, string[]>(),
                downloadId: 'download-id',
                malwareDetection: createMalwareDetectionMock(),
                skipSignatureCheck: true,
                startEntriesInOrder,
            });
            return schedulerInstance;
        };

        it('should schedule every entry right away by default', async () => {
            const schedulerInstance = createGenerator();

            await waitForCondition(() => schedulerInstance._tasks.length === 2);
            expect(schedulerInstance._tasks.map((task) => task.node.uid)).toEqual(['folder-1', 'folder-2']);
        });

        it('should schedule an entry only once the previous one started when asked', async () => {
            const schedulerInstance = createGenerator(true);
            await waitForCondition(() => schedulerInstance._tasks.length > 0);
            await flushAsync(10);

            expect(schedulerInstance._tasks.map((task) => task.node.uid)).toEqual(['folder-1']);

            void schedulerInstance._tasks[0].start();

            await waitForCondition(() => schedulerInstance._tasks.length === 2);
            expect(schedulerInstance._tasks.map((task) => task.node.uid)).toEqual(['folder-1', 'folder-2']);
        });
    });

    it('should resolve waitForFirstItem once first item is scheduled', async () => {
        const abortController = new AbortController();
        const schedulerInstance = schedulerTracker.Mock();
        const downloadController = {
            pause: vi.fn(),
            resume: vi.fn(),
            completion: vi.fn(async () => undefined),
        };

        const downloadToStream = vi.fn(
            (_writable: unknown, _onProgress: (bytes: number) => void) => downloadController
        );
        getDownloadSdkMock.mockImplementation(() => ({
            getFileDownloader: vi.fn(async () => ({
                downloadToStream,
                getClaimedSizeInBytes: vi.fn(() => 1024),
            })),
        }));

        const node = createMockNodeEntity({ uid: 'file-wait', name: { ok: true, value: 'wait.txt' } });
        async function* entries() {
            yield node;
        }

        const generatorInstance = new ArchiveStreamGenerator({
            entries: entries(),
            onProgress: vi.fn(),
            scheduler: schedulerInstance,
            abortController,
            parentPathByUid: new Map<string, string[]>([['file-wait', [] as string[]]]),
            downloadId: 'download-id',
            malwareDetection: createMalwareDetectionMock(),
        });

        await flushAsync();
        const waitPromise = generatorInstance.waitForFirstItem();

        const task = schedulerInstance._tasks[0];
        const completionPromise = task.start();
        await completionPromise;
        await flushAsync();

        await expect(waitPromise).resolves.toBeUndefined();
    });

    it('should resolve waitForFirstItem and close the generator when entries are empty', async () => {
        const abortController = new AbortController();
        const schedulerInstance = schedulerTracker.Mock();

        async function* entries() {
            // no yields: e.g. an empty album/folder
        }

        const generatorInstance = new ArchiveStreamGenerator({
            entries: entries(),
            onProgress: vi.fn(),
            scheduler: schedulerInstance,
            abortController,
            parentPathByUid: new Map<string, string[]>(),
            downloadId: 'download-id',
            malwareDetection: createMalwareDetectionMock(),
        });

        await flushAsync();

        await expect(generatorInstance.waitForFirstItem()).resolves.toBeUndefined();

        const finalIteration = await generatorInstance.generator.next();
        expect(finalIteration.done).toBe(true);
    });

    it.skip('should propagate downloader errors to consumers', async () => {
        const abortController = new AbortController();
        const schedulerInstance = schedulerTracker.Mock();
        const downloadControllerDeferred = createDeferred<void>();
        const downloadController = {
            pause: vi.fn(),
            resume: vi.fn(),
            completion: vi.fn(() => downloadControllerDeferred.promise),
        };

        const downloadToStream = vi.fn(
            (_writable: unknown, _onProgress: (bytes: number) => void) => downloadController
        );
        const getFileDownloader = vi.fn(async () => ({
            downloadToStream,
            getClaimedSizeInBytes: vi.fn(() => 1024),
        }));
        getDownloadSdkMock.mockImplementation(() => ({
            getFileDownloader,
        }));

        const node = createMockNodeEntity({ uid: 'file-error', name: { ok: true, value: 'error.txt' } });
        async function* entries() {
            yield node;
        }

        const generatorInstance = new ArchiveStreamGenerator({
            entries: entries(),
            onProgress: vi.fn(),
            scheduler: schedulerInstance,
            abortController,
            parentPathByUid: new Map<string, string[]>([['file-error', [] as string[]]]),
            downloadId: 'download-id',
            malwareDetection: createMalwareDetectionMock(),
        });

        await flushAsync();
        const task = schedulerInstance._tasks[0];
        const startPromise = task.start();

        const firstValue = await generatorInstance.generator.next();
        expect(firstValue.done).toBe(false);

        const failure = new Error('boom');
        downloadControllerDeferred.reject(failure);
        await expect(startPromise).rejects.toThrow('boom');

        await expect(generatorInstance.generator.next()).rejects.toBe(failure);
        expect(handleDownloadErrorMock).toHaveBeenCalledWith('download-id', [node], failure, false);
    });
});
