import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';

import { MAX_DOWNLOADING_BLOCKS, MAX_DOWNLOADING_FILES_LOAD } from '../../store/_downloads/constants';
import { DownloadScheduler } from './DownloadScheduler';
import type { DownloadQueueTask, DownloadQueueTaskHandle } from './downloadTypes';
import { createMockNodeEntity } from './testUtils';

type Deferred<T> = {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
};

function createDeferred<T = void>(): Deferred<T> {
    let resolve!: Deferred<T>['resolve'];
    let reject!: Deferred<T>['reject'];
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

let taskCounter = 0;

function makeTask(
    start: jest.Mock<Promise<DownloadQueueTaskHandle>>,
    overrides: Partial<DownloadQueueTask> = {}
): DownloadQueueTask {
    const { taskId, node, storageSizeEstimate, ...rest } = overrides;

    taskCounter += 1;
    const resolvedTaskId = taskId ?? `task-${taskCounter}`;
    const resolvedNode =
        node ??
        createMockNodeEntity({
            uid: `node-${taskCounter}`,
            name: `file-${taskCounter}`,
        });

    return {
        taskId: resolvedTaskId,
        node: resolvedNode,
        storageSizeEstimate,
        ...rest,
        start,
    };
}

const saturateConcurrency = (scheduler: DownloadScheduler, count = MAX_DOWNLOADING_FILES_LOAD) =>
    Array.from({ length: count }, () => {
        const completion = createDeferred<void>();
        const start = jest.fn(async () => ({ completion: completion.promise }));
        scheduler.scheduleDownload(makeTask(start));
        return { completion, start };
    });

describe('DownloadScheduler', () => {
    beforeEach(() => {
        jest.useRealTimers();
        taskCounter = 0;
    });

    it('should respect the maximum number of concurrent downloads', async () => {
        const scheduler = new DownloadScheduler();
        const blockingTasks = saturateConcurrency(scheduler);
        const pendingStart = jest.fn(async () => ({ completion: Promise.resolve() }));
        scheduler.scheduleDownload(makeTask(pendingStart));

        await Promise.resolve();

        blockingTasks.forEach(({ start }) => expect(start).toHaveBeenCalledTimes(1));
        expect(pendingStart).not.toHaveBeenCalled();

        blockingTasks[0].completion.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(pendingStart).toHaveBeenCalledTimes(1);
    });

    it('should not start a task that was cancelled while pending', async () => {
        const scheduler = new DownloadScheduler();
        const blockingTasks = saturateConcurrency(scheduler);
        const secondStart = jest.fn(async () => ({ completion: Promise.resolve() }));

        const secondId = scheduler.scheduleDownload(makeTask(secondStart));

        await Promise.resolve();

        expect(secondStart).not.toHaveBeenCalled();

        scheduler.cancelDownload(secondId);

        blockingTasks[0].completion.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(secondStart).not.toHaveBeenCalled();
    });

    it('should clear pending and active downloads', async () => {
        const scheduler = new DownloadScheduler();
        const blockingTasks = saturateConcurrency(scheduler);
        const pendingStart = jest.fn(async () => ({ completion: Promise.resolve() }));

        scheduler.scheduleDownload(makeTask(pendingStart));
        scheduler.clearDownloads();

        blockingTasks.forEach(({ completion }) => completion.resolve());
        await Promise.resolve();
        await Promise.resolve();

        expect(pendingStart).not.toHaveBeenCalled();
    });

    it('should generate unique task identifiers', () => {
        const scheduler = new DownloadScheduler();

        const ids = new Set([scheduler.generateTaskId(), scheduler.generateTaskId(), scheduler.generateTaskId()]);

        expect(ids.size).toBe(3);
        [...ids].forEach((id) => expect(id).toMatch(/^download-task-/));
    });

    it('should throttle downloads when starting another exceeds block load budget', async () => {
        const scheduler = new DownloadScheduler();

        const firstCompletion = createDeferred<void>();
        const firstStart = jest.fn(async () => ({ completion: firstCompletion.promise }));
        const secondStart = jest.fn(async () => ({ completion: Promise.resolve() }));

        scheduler.scheduleDownload(
            makeTask(firstStart, { storageSizeEstimate: FILE_CHUNK_SIZE * (MAX_DOWNLOADING_BLOCKS + 5) })
        );
        scheduler.scheduleDownload(makeTask(secondStart, { storageSizeEstimate: FILE_CHUNK_SIZE * 6 }));

        await Promise.resolve();

        expect(firstStart).toHaveBeenCalledTimes(1);
        expect(secondStart).not.toHaveBeenCalled();

        firstCompletion.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(secondStart).toHaveBeenCalledTimes(1);
    });

    it('should start additional downloads even when a prior task lacks a size estimate', async () => {
        const scheduler = new DownloadScheduler();

        const firstCompletion = createDeferred<void>();
        const firstStart = jest.fn(async () => ({ completion: firstCompletion.promise }));
        const secondStart = jest.fn(async () => ({ completion: Promise.resolve() }));

        scheduler.scheduleDownload(
            makeTask(firstStart, {
                node: createMockNodeEntity({
                    uid: 'unknown',
                    name: 'mystery.bin',
                    activeRevision: undefined,
                    totalStorageSize: undefined,
                }),
            })
        );
        scheduler.scheduleDownload(makeTask(secondStart, { storageSizeEstimate: FILE_CHUNK_SIZE }));

        await Promise.resolve();

        expect(firstStart).toHaveBeenCalledTimes(1);
        expect(secondStart).toHaveBeenCalledTimes(1);

        firstCompletion.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(secondStart).toHaveBeenCalledTimes(1);
    });
});
