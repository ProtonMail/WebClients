import { FileStorageMemory, MemoryWritableStream } from './fs.memory';
import { createMockBlob, createMockReadableStream } from './testing';

describe('FileStorageMemory', () => {
    const fs = new FileStorageMemory();

    jest.useFakeTimers();

    beforeEach(() => {
        jest.clearAllMocks();
        void fs.clearAll();
    });

    describe('`MemoryWritableStream`', () => {
        test('should correctly write data to memory store', async () => {
            const filename = 'test.writable';
            const store = new Map();
            const chunks = [createMockBlob(10), createMockBlob(15), createMockBlob(5)];

            const writableStream = MemoryWritableStream(store, filename);
            const writer = writableStream.getWriter();

            for (const chunk of chunks) await writer.write(chunk);
            await writer.close();

            expect(store.has(filename)).toBe(true);
            const storedChunks = store.get(filename);
            expect(storedChunks.length).toBe(chunks.length);

            for (let i = 0; i < chunks.length; i++) {
                expect(storedChunks[i].size).toBe(chunks[i].size);
            }
        });
    });

    describe('`readFile`', () => {
        test('should return `undefined` if the file does not exist', async () => {
            const result = await fs.readFile('does-not-exist');
            expect(result).toBeUndefined();
        });

        test('should read single chunk files', async () => {
            const { signal } = new AbortController();
            const blob = createMockBlob(42);
            await fs.writeFile('test.file', blob, signal);
            const result = await fs.readFile('test.file');

            expect(result).toBeDefined();
            expect(result?.size).toBe(42);
        });

        test('should read multiple chunk files', async () => {
            const { signal } = new AbortController();
            const blobs = [createMockBlob(20), createMockBlob(20), createMockBlob(2)];
            const stream = createMockReadableStream(blobs);
            await fs.writeFile('test.stream', stream, signal);
            const result = await fs.readFile('test.stream');

            expect(result).toBeDefined();
            expect(result?.size).toBe(42);
        });

        test('should auto-delete after read', async () => {
            const deleteFile = jest.spyOn(fs, 'deleteFile');

            const { signal } = new AbortController();
            const blob = createMockBlob(42);
            await fs.writeFile('test.file', blob, signal);
            await fs.readFile('test.file');

            expect(fs.files.get('test.file')).toBeUndefined();
            expect(deleteFile).toHaveBeenCalledWith('test.file');

            deleteFile.mockRestore();
        });
    });

    describe('`writeFile`', () => {
        test('should handle cancellation via AbortSignal', async () => {
            const controller = new AbortController();
            const blobs = Array.from({ length: 5 }).map(() => createMockBlob(100));
            const stream = createMockReadableStream(blobs, 100);
            setTimeout(() => controller.abort(), 250);

            const job = fs.writeFile('test.cancelled', stream, controller.signal);
            jest.runAllTimers();

            await expect(job).rejects.toThrow();
            const result = await fs.readFile('test.cancelled');
            expect(result).toBeUndefined();
        });

        test('should not write when signal is already aborted', async () => {
            const controller = new AbortController();
            controller.abort();
            const blob = createMockBlob(42);

            await expect(fs.writeFile('test.aborted', blob, controller.signal)).rejects.toThrow();
            const result = await fs.readFile('test.aborted');
            expect(result).toBeUndefined();
        });
    });

    describe('`deleteFile`', () => {
        test('should delete a single chunk file', async () => {
            const { signal } = new AbortController();
            const blob = createMockBlob(42);
            await fs.writeFile('test.file', blob, signal);
            await fs.readFile('test.file');

            await fs.deleteFile('test.file');
            const deleted = await fs.readFile('test.file');
            expect(deleted).toBeUndefined();
        });

        test('should delete multiple chunk files', async () => {
            const { signal } = new AbortController();
            const blobs = [createMockBlob(20), createMockBlob(20), createMockBlob(2)];
            const stream = createMockReadableStream(blobs);
            await fs.writeFile('test.stream', stream, signal);

            await fs.deleteFile('test.stream');
            const deleted = await fs.readFile('test.stream');
            expect(deleted).toBeUndefined();
        });
    });

    describe('`clearAll`', () => {
        test('should clear all files from storage', async () => {
            const { signal } = new AbortController();
            await fs.writeFile('file1', createMockBlob(10), signal);
            await fs.writeFile('file2', createMockBlob(20), signal);

            expect(await fs.readFile('file1')).toBeDefined();
            expect(await fs.readFile('file2')).toBeDefined();

            await fs.clearAll();

            expect(await fs.readFile('file1')).toBeUndefined();
            expect(await fs.readFile('file2')).toBeUndefined();
        });
    });
});
