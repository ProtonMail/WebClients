import { jest } from '@jest/globals';

import { NodeType } from '@proton/drive/index';

import type { ArchiveStreamGenerator as ArchiveStreamGeneratorClass } from './ArchiveStreamGenerator';
import type { DownloadQueueTask } from './downloadTypes';
import { createDeferred, createMockNodeEntity, flushAsync, trackInstances } from './testUtils';

const getDriveMock = jest.fn();

jest.mock('@proton/drive', () => {
    const actual = jest.requireActual('@proton/drive');
    return {
        ...(actual as {}),
        getDrive: getDriveMock,
    };
});

jest.mock('@proton/drive/index', () => {
    const actual = jest.requireActual('@proton/drive/index');
    return {
        ...(actual as {}),
        getDrive: getDriveMock,
    };
});

const { ArchiveStreamGenerator } = require('./ArchiveStreamGenerator') as {
    ArchiveStreamGenerator: typeof ArchiveStreamGeneratorClass;
};

const ensureTransformStream = () => {
    if (typeof globalThis.TransformStream === 'undefined') {
        const { TransformStream } = require('stream/web');
        globalThis.TransformStream = TransformStream;
    }
};

const schedulerTracker = trackInstances(() => {
    const tasks: DownloadQueueTask[] = [];
    let counter = 0;
    return {
        scheduleDownload: jest.fn((task: DownloadQueueTask) => {
            tasks.push(task);
            return `task-${tasks.length}`;
        }),
        cancelDownload: jest.fn(),
        clearDownloads: jest.fn(),
        generateTaskId: jest.fn(() => `task-${++counter}`),
        updateDownloadProgress: jest.fn(),
        _tasks: tasks,
    };
});

describe('ArchiveStreamGenerator', () => {
    beforeAll(() => {
        ensureTransformStream();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        schedulerTracker.reset();
    });

    it('should schedule file entries and expose generator/controller', async () => {
        const abortController = new AbortController();
        const progressSpy = jest.fn();
        const downloadControllerDeferred = createDeferred<void>();
        const downloadController = {
            pause: jest.fn(),
            resume: jest.fn(),
            completion: jest.fn(() => downloadControllerDeferred.promise),
        };

        const downloadToStream = jest.fn((_writable: unknown, onProgress: (bytes: number) => void) => {
            onProgress(512);
            return downloadController;
        });

        const getFileDownloader = jest.fn(async (_uid: string, _signal: AbortSignal) => ({
            downloadToStream,
        }));

        getDriveMock.mockImplementation(() => ({
            getFileDownloader,
        }));

        const schedulerInstance = schedulerTracker.Mock();

        const node = createMockNodeEntity({
            uid: 'file-1',
            name: 'file.txt',
        });

        async function* entries() {
            yield node;
        }

        const parentPaths = new Map<string, string[]>([['file-1', ['folder']]]);
        const generatorInstance = new ArchiveStreamGenerator(
            entries(),
            progressSpy,
            schedulerInstance,
            abortController.signal,
            parentPaths
        );

        await flushAsync();
        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);
        const scheduledTask = schedulerInstance._tasks[0];
        expect(scheduledTask.storageSizeEstimate).toBe(node.activeRevision?.storageSize ?? 0);

        const { completion } = await scheduledTask.start();

        const { value, done } = await generatorInstance.generator.next();
        expect(done).toBe(false);
        expect(value?.isFile).toBe(true);
        expect(value?.name).toBe(node.name);
        expect(value?.parentPath).toEqual(['folder']);

        expect(getFileDownloader).toHaveBeenCalledWith(node.uid, abortController.signal);
        expect(downloadToStream).toHaveBeenCalledTimes(1);
        expect(progressSpy).toHaveBeenCalledWith(512);

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

    it('should enqueue folder entries without accessing downloader', async () => {
        const schedulerInstance = schedulerTracker.Mock();
        getDriveMock.mockImplementation(() => ({
            getFileDownloader: jest.fn(async () => undefined),
        }));

        const folderNode = createMockNodeEntity({
            uid: 'folder-1',
            name: 'Folder',
            type: NodeType.Folder,
            activeRevision: undefined,
        });

        async function* entries() {
            yield folderNode;
        }

        const progressSpy = jest.fn();
        const generatorInstance = new ArchiveStreamGenerator(
            entries(),
            progressSpy,
            schedulerInstance,
            new AbortController().signal,
            new Map<string, string[]>([['folder-1', []]])
        );

        await flushAsync();
        expect(schedulerInstance.scheduleDownload).toHaveBeenCalledTimes(1);
        const scheduledTask = schedulerInstance._tasks[0];

        await scheduledTask.start();
        await flushAsync();

        const { value, done } = await generatorInstance.generator.next();
        expect(done).toBe(false);
        expect(value?.isFile).toBe(false);
        expect(value?.name).toBe('Folder');

        const finalIteration = await generatorInstance.generator.next();
        expect(finalIteration.done).toBe(true);
        expect(progressSpy).not.toHaveBeenCalled();
    });
});
