import { FileStorageGarbageCollector } from './fs.gc';
import type { FileStorage } from './types';

const { STORAGE_KEY } = FileStorageGarbageCollector;

describe('FileStorageGarbageCollector', () => {
    let gc: FileStorageGarbageCollector;

    const fs = {
        type: 'test',
        deleteFile: vi.fn().mockResolvedValue(undefined),
    };

    const getItem = vi.fn((key: string) => localStorage.getItem(key));
    const setItem = vi.fn((key: string, value: string) => localStorage.setItem(key, value));
    const removeItem = vi.fn((key: string) => localStorage.removeItem(key));
    const clear = vi.fn(() => localStorage.clear());

    const storage = {
        getItem,
        setItem,
        removeItem,
        clear,
    };

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        localStorage.clear();

        gc = new FileStorageGarbageCollector(fs as unknown as FileStorage, storage);
    });

    afterEach(() => {
        vi.useRealTimers();
        localStorage.clear();
    });

    test('should initialize with empty pending deletions', () => {
        expect(gc.queued()).toEqual([]);
    });

    test('should add file to deletion queue and schedule deletion', async () => {
        gc.push('file1.txt');

        await vi.advanceTimersByTimeAsync(0);

        expect(getItem).toHaveBeenCalledWith(STORAGE_KEY);
        expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(['file1.txt']));
        expect(gc.queued()).toContain('file1.txt');

        await vi.advanceTimersByTimeAsync(40_000);
        expect(fs.deleteFile).toHaveBeenCalledWith('file1.txt');
    });

    test('should reset timer when pushing existing file', async () => {
        gc.push('file1.txt', { timeout: 10_000 });

        await vi.advanceTimersByTimeAsync(5_000);
        expect(fs.deleteFile).not.toHaveBeenCalled();

        gc.push('file1.txt', { timeout: 10_000 });
        await vi.advanceTimersByTimeAsync(5_000);
        expect(fs.deleteFile).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(10_000);
        expect(fs.deleteFile).toHaveBeenCalledWith('file1.txt');
    });

    test('should remove file from deletion queue', async () => {
        gc.push('file1.txt');
        gc.push('file2.txt');
        await vi.advanceTimersByTimeAsync(0);

        gc.pop('file1.txt');
        await vi.runAllTimersAsync();

        expect(getItem).toHaveBeenCalledWith(STORAGE_KEY);
        expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(['file2.txt']));

        expect(gc.queued()).not.toContain('file1.txt');
        expect(gc.queued()).toContain('file2.txt');

        vi.advanceTimersByTime(40_000);

        expect(fs.deleteFile).not.toHaveBeenCalledWith('file1.txt');
        expect(fs.deleteFile).toHaveBeenCalledWith('file2.txt');
    });

    test('should clear all pending deletions', async () => {
        gc.push('file1.txt');
        gc.push('file2.txt');
        await vi.runAllTimersAsync();

        await gc.clear();

        expect(fs.deleteFile).toHaveBeenCalledWith('file1.txt');
        expect(fs.deleteFile).toHaveBeenCalledWith('file2.txt');
        expect(gc.queued()).toEqual([]);
    });

    test('should clear local queue and delete all queued files', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(['file1.txt', 'file2.txt']));
        await gc.clearQueue();

        expect(fs.deleteFile).toHaveBeenCalledWith('file1.txt');
        expect(fs.deleteFile).toHaveBeenCalledWith('file2.txt');
        expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify([]));
    });

    test('should call push when stream is consumed', async () => {
        const filename = 'stream.txt';
        const transform = gc.stream(filename);
        const push = vi.spyOn(gc, 'push');
        const writer = new WritableStream();
        const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])];

        await new ReadableStream({
            start(controller) {
                for (const chunk of chunks) controller.enqueue(chunk);
                controller.close();
            },
        })
            .pipeThrough(transform)
            .pipeTo(writer);

        expect(push).toHaveBeenCalledTimes(chunks.length);
        expect(push).toHaveBeenCalledWith(filename, { enqueueForDeletion: false });
    });

    test('should handle corrupt data in local queue', async () => {
        localStorage.setItem(STORAGE_KEY, 'invalid-json');
        await gc.clearQueue();
        expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify([]));
    });
});
