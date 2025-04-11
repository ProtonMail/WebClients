import 'fake-indexeddb/auto';

import {
    FileStorageIDB,
    IDBReadableStream,
    IDBWritableStream,
    getFileChunkName,
    openPassFileDB,
    removeIDBFileChunks,
    writeIDBFileChunk,
} from './fs.idb';
import { createMockBlob, createMockReadableStream } from './testing';
import type { FileStorage } from './types';

const writeChunks = async (filename: string, totalChunks: number) => {
    const db = await openPassFileDB();
    const chunks = Array.from({ length: totalChunks }).map(() => createMockBlob(5));

    for (let i = 0; i < totalChunks; i++) {
        const setupTx = db.transaction(['files', 'metadata'], 'readwrite');
        await writeIDBFileChunk(setupTx)(filename, i, chunks[i]);
    }

    return { db, chunks };
};

describe('FileStorageIDB', () => {
    const fs: FileStorage = new FileStorageIDB();

    jest.useFakeTimers();

    beforeEach(() => {
        jest.clearAllMocks();
        void fs.clearAll();
    });

    describe('`getFileChunkName`', () => {
        test('should format filename and index correctly', () => {
            expect(getFileChunkName('test.file', 0)).toBe('test.file:0');
            expect(getFileChunkName('test.file', 42)).toBe('test.file:42');
            expect(getFileChunkName('test/path/file.txt', 3)).toBe('test/path/file.txt:3');
        });
    });

    describe('`openPassFileDB`', () => {
        test('should open IndexedDB database with correct stores', async () => {
            const db = await openPassFileDB();

            expect(db.name).toBe('pass:files');
            expect(db.version).toBe(1);

            const storeNames = db.objectStoreNames;
            expect(storeNames).toContain('files');
            expect(storeNames).toContain('metadata');

            db.close();
        });
    });

    describe('`writeIDBFileChunk`', () => {
        test('should write chunk and update metadata', async () => {
            const filename = 'test';
            const totalChunks = 3;
            const { db, chunks } = await writeChunks(filename, totalChunks);

            for (let i = 0; i < totalChunks; i++) {
                const chunk = await db.get('files', getFileChunkName(filename, i));
                expect(chunk).toEqual(chunks[i]);
            }

            const metadata = await db.get('metadata', filename);
            expect(metadata).toEqual({ totalChunks });

            db.close();
        });
    });

    describe('`removeIDBFileChunks`', () => {
        test('should remove file chunks and metadata', async () => {
            const filename = 'test.remove';
            const totalChunks = 3;
            const { db } = await writeChunks(filename, totalChunks);

            const removeTx = db.transaction(['files', 'metadata'], 'readwrite');
            await Promise.all(removeIDBFileChunks(removeTx)(filename, totalChunks));

            for (let i = 0; i < totalChunks; i++) {
                const removed = await db.get('files', getFileChunkName(filename, i));
                expect(removed).toBeUndefined();
            }

            const metadata = await db.get('metadata', filename);
            expect(metadata).toBeUndefined();

            db.close();
        });
    });

    describe('`IDBReadableStream`', () => {
        test('should correctly read data', async () => {
            const filename = 'test.readable';
            const db = await openPassFileDB();
            const chunks = [createMockBlob(10), createMockBlob(15), createMockBlob(5)];

            for (let i = 0; i < chunks.length; i++) {
                const tx = db.transaction(['files', 'metadata'], 'readwrite');
                await writeIDBFileChunk(tx)(filename, i, chunks[i]);
            }

            const readableStream = IDBReadableStream(db, filename);
            const receivedChunks: Blob[] = [];
            const reader = readableStream.getReader() as ReadableStreamDefaultReader<Blob>;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                receivedChunks.push(value);
            }

            expect(receivedChunks.length).toBe(chunks.length);

            for (let i = 0; i < chunks.length; i++) {
                expect(receivedChunks[i].size).toBe(chunks[i].size);
            }
        });
    });

    describe('`IDBWritableStream`', () => {
        test('should correctly write data', async () => {
            const filename = 'test.writable';
            const db = await openPassFileDB();
            const chunks = [createMockBlob(10), createMockBlob(15), createMockBlob(5)];

            const writableStream = IDBWritableStream(db, filename);
            const writer = writableStream.getWriter();

            for (const chunk of chunks) await writer.write(chunk);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = await db.get('files', getFileChunkName(filename, i));
                expect(chunk).toBeDefined();
                expect((chunk as Blob).size).toBe(chunks[i].size);
            }

            const metadata = await db.get('metadata', filename);
            expect(metadata).toEqual({ totalChunks: chunks.length });

            await writer.close();
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
});
