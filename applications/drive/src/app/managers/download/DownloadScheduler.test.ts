import { DownloadScheduler } from './DownloadScheduler';
import type { DownloadQueueTask, DownloadQueueTaskHandle } from './downloadTypes';

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

function makeTask(start: jest.Mock<Promise<DownloadQueueTaskHandle>>): DownloadQueueTask {
    return {
        nodes: [],
        start,
    };
}

describe('DownloadScheduler', () => {
    beforeEach(() => {
        jest.useRealTimers();
    });

    it('should respect the maximum number of concurrent downloads', async () => {
        const scheduler = new DownloadScheduler({ maxConcurrentDownloads: 1 });
        const firstCompletion = createDeferred<void>();
        const firstStart = jest.fn(async () => ({ completion: firstCompletion.promise }));
        const secondStart = jest.fn(async () => ({ completion: Promise.resolve() }));

        scheduler.scheduleDownload(makeTask(firstStart));
        scheduler.scheduleDownload(makeTask(secondStart));

        await Promise.resolve();

        expect(firstStart).toHaveBeenCalledTimes(1);
        expect(secondStart).not.toHaveBeenCalled();

        firstCompletion.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(secondStart).toHaveBeenCalledTimes(1);
    });

    it('should not start a task that was cancelled while pending', async () => {
        const scheduler = new DownloadScheduler({ maxConcurrentDownloads: 1 });
        const firstCompletion = createDeferred<void>();
        const firstStart = jest.fn(async () => ({ completion: firstCompletion.promise }));
        const secondStart = jest.fn(async () => ({ completion: Promise.resolve() }));

        scheduler.scheduleDownload(makeTask(firstStart));
        const secondId = scheduler.scheduleDownload(makeTask(secondStart));

        scheduler.cancelDownload(secondId);

        await Promise.resolve();
        expect(firstStart).toHaveBeenCalledTimes(1);
        expect(secondStart).not.toHaveBeenCalled();

        firstCompletion.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(secondStart).not.toHaveBeenCalled();
    });

    it('should clear pending and active downloads', async () => {
        const scheduler = new DownloadScheduler({ maxConcurrentDownloads: 1 });
        const firstCompletion = createDeferred<void>();
        const firstStart = jest.fn(async () => ({ completion: firstCompletion.promise }));
        const secondStart = jest.fn(async () => ({ completion: Promise.resolve() }));

        scheduler.scheduleDownload(makeTask(firstStart));
        scheduler.scheduleDownload(makeTask(secondStart));

        scheduler.clearDownloads();

        firstCompletion.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(secondStart).not.toHaveBeenCalled();
    });

    it('should generate unique task identifiers', () => {
        const scheduler = new DownloadScheduler();

        const ids = new Set([
            scheduler.scheduleDownload(makeTask(jest.fn(async () => ({ completion: Promise.resolve() })))),
            scheduler.scheduleDownload(makeTask(jest.fn(async () => ({ completion: Promise.resolve() })))),
            scheduler.scheduleDownload(makeTask(jest.fn(async () => ({ completion: Promise.resolve() })))),
        ]);

        expect(ids.size).toBe(3);
        [...ids].forEach((id) => expect(id).toMatch(/^download-task-/));
    });
});
