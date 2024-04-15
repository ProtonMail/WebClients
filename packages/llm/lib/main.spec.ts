/* eslint-disable @typescript-eslint/no-unused-vars */
import type { MonitorDownloadCallback } from './types';
import { DummyLlmManager, DummyLlmModel } from './dummy';

describe('DummyLlmManager', () => {
    let llmManager: DummyLlmManager;

    beforeEach(() => {
        llmManager = new DummyLlmManager();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return true for hasGpu()', () => {
        expect(llmManager.hasGpu()).toBeTruthy();
    });

    describe('startDownload()', () => {
        let callback: MonitorDownloadCallback;

        beforeEach(() => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            callback = jest.fn((_progress, _done) => {});
        });

        it('should start downloading and update progress', async () => {
            await llmManager.startDownload(callback);
            await jest.runAllTimersAsync();
            expect(callback).toHaveBeenNthCalledWith(1, 0 / 50, false);
            expect(callback).toHaveBeenNthCalledWith(2, 1 / 50, false);
            expect(callback).toHaveBeenNthCalledWith(49, 48 / 50, false);
            expect(callback).toHaveBeenNthCalledWith(50, 49 / 50, false);
            expect(callback).toHaveBeenNthCalledWith(51, 50 / 50, true);
            expect(callback).toHaveBeenCalledTimes(51);
        });

        it('should complete downloading after a delay of 60 seconds', async () => {
            await llmManager.startDownload(callback);
            await jest.advanceTimersByTimeAsync(60000);
            expect(callback).toHaveBeenLastCalledWith(50 / 50, true);
            expect(llmManager.isDownloading()).toBeFalsy();
        });

        it('should cancel downloading', async () => {
            expect(llmManager.isDownloading()).toBeFalsy();

            await llmManager.startDownload(callback);
            expect(llmManager.isDownloading()).toBeTruthy();

            await jest.advanceTimersByTimeAsync(2000);
            expect(llmManager.isDownloading()).toBeTruthy();
            expect(callback).toHaveBeenCalled();

            llmManager.cancelDownload();
            expect(llmManager.isDownloading()).toBeFalsy();
            expect(callback).not.toHaveBeenCalledTimes(51);

            jest.runAllTimers();
            expect(callback).not.toHaveBeenCalledTimes(51);
            expect(llmManager.isDownloading()).toBeFalsy();
        });
    });

    describe('loadOnGpu()', () => {
        it('should return a new instance of DummyLlmModel', async () => {
            const promise = llmManager.loadOnGpu();
            jest.advanceTimersByTime(10000);
            const llm = await promise;
            expect(llm).toBeInstanceOf(DummyLlmModel);
        });
    });
});

describe('LlmModel', () => {
    let model: DummyLlmModel;

    beforeEach(async () => {
        jest.useFakeTimers();
        const llmManager = new DummyLlmManager();
        const promise = llmManager.loadOnGpu();
        await jest.advanceTimersByTimeAsync(20000);
        model = await promise;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return a new instance of DummyLlmModel', async () => {
        expect(model).toBeInstanceOf(DummyLlmModel);
        await jest.advanceTimersByTimeAsync(60000);
    });

    it('should write a full email', async () => {
        let acc = '';
        const callback = jest.fn((token: string, fulltext: string) => {
            expect(token.length).toBeGreaterThan(0);
            acc += token;
            expect(fulltext).toEqual(acc);
        });
        // @ts-ignore
        const runningAction = await model.performAction(
            {
                type: 'writeFullEmail',
                prompt: 'write a sample email',
            },
            callback
        );
        let resolved = false;
        runningAction.waitForCompletion().then(() => (resolved = true));
        expect(resolved).toEqual(false);
        await jest.runAllTimersAsync();
        expect(resolved).toEqual(true);
        expect(callback).toHaveBeenCalled();
        expect(acc.length).toBeGreaterThanOrEqual(10);
    });

    it('should be able to stop generation', async () => {
        const callback = jest.fn(() => {});
        const runningAction = await model.performAction(
            {
                type: 'writeFullEmail',
                prompt: 'write a sample email',
            },
            callback
        );
        await jest.advanceTimersByTimeAsync(10000);
        expect(callback).toHaveBeenCalled();
        expect(runningAction.isRunning()).toBeTruthy();
        expect(runningAction.isDone()).toBeFalsy();
        expect(runningAction.isCancelled()).toBeFalsy();

        const cancelled = runningAction.cancel();
        expect(cancelled).toBeTruthy();
        expect(runningAction.isRunning()).toBeFalsy();
        expect(runningAction.isDone()).toBeFalsy();
        expect(runningAction.isCancelled()).toBeTruthy();

        const cancelled2 = runningAction.cancel();
        expect(cancelled2).toBeFalsy();
    });
});
