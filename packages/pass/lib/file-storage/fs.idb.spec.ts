import 'fake-indexeddb/auto';

import { FileStorageIDB } from './fs.idb';
import type { FileStorage } from './types';

const createMockBlob = (sizeInBytes: number) => {
    const data = new Uint8Array(sizeInBytes);
    crypto.getRandomValues(data);
    return new Blob([data]);
};

const createMockReadableStream = (chunks: Blob[]) => {
    let current = 0;

    const processNextChunk = (controller: ReadableStreamDefaultController<Blob>) => {
        if (current >= chunks.length) return controller.close();
        controller.enqueue(chunks[current]);
        current++;
    };

    return new ReadableStream<Blob>({
        start(controller) {
            if (chunks.length > 0) processNextChunk(controller);
            else controller.close();
        },

        pull(controller) {
            processNextChunk(controller);
        },
    });
};

describe('FileStorageIDB', () => {
    const fs: FileStorage = new FileStorageIDB();

    beforeEach(() => {
        jest.clearAllMocks();
        void fs.clearAll();
    });

    describe('readFile', () => {
        test('should return `undefined` if the file does not exist', async () => {
            const result = await fs.readFile('does-not-exist');
            expect(result).toBeUndefined();
        });

        test('should read single chunk files', async () => {
            const blob = createMockBlob(42);
            await fs.writeFile('test.file', blob);
            const result = await fs.readFile('test.file');

            expect(result).toBeDefined();
            expect(result?.size).toBe(42);
        });

        test('should read multiple chunk files', async () => {
            const blobs = [createMockBlob(20), createMockBlob(20), createMockBlob(2)];
            const stream = createMockReadableStream(blobs);
            await fs.writeFile('test.stream', stream);
            const result = await fs.readFile('test.stream');

            expect(result).toBeDefined();
            expect(result?.size).toBe(42);
        });
    });

    describe('deleteFile', () => {
        test('should delete a single chunk file', async () => {
            const blob = createMockBlob(42);
            await fs.writeFile('test.file', blob);
            await fs.readFile('test.file');

            await fs.deleteFile('test.file');
            const deleted = await fs.readFile('test.file');
            expect(deleted).toBeUndefined();
        });

        test('should delete multiple chunk files', async () => {
            const blobs = [createMockBlob(20), createMockBlob(20), createMockBlob(2)];
            const stream = createMockReadableStream(blobs);
            await fs.writeFile('test.stream', stream);

            await fs.deleteFile('test.stream');
            const deleted = await fs.readFile('test.stream');
            expect(deleted).toBeUndefined();
        });
    });
});
