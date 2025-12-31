import { createFileStream } from './createFileStream';

describe('createFileStream', () => {
    beforeAll(() => {
        if (!Blob.prototype.arrayBuffer) {
            Blob.prototype.arrayBuffer = async function () {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as ArrayBuffer);
                    reader.onerror = () => reject(reader.error);
                    reader.readAsArrayBuffer(this);
                });
            };
        }
    });

    const createMockFile = (size: number, name: string = 'test.txt'): File => {
        const content = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            content[i] = i % 256;
        }
        return new File([content], name, { type: 'text/plain' });
    };

    const readStream = async (stream: ReadableStream<Uint8Array<ArrayBuffer>>): Promise<Uint8Array<ArrayBuffer>> => {
        const reader = stream.getReader();
        const chunks: Uint8Array<ArrayBuffer>[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            chunks.push(value);
        }

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return result;
    };

    it('should create a readable stream from a file', async () => {
        const file = createMockFile(100);
        const stream = createFileStream(file);

        expect(stream).toBeInstanceOf(ReadableStream);
    });

    it('should stream file content in 4MB chunks by default', async () => {
        const chunkSize = 4 * 1024 * 1024;
        const fileSize = chunkSize * 2 + 1000;
        const file = createMockFile(fileSize);

        const stream = createFileStream(file);
        const reader = stream.getReader();

        const { value: chunk1 } = await reader.read();
        expect(chunk1?.length).toBe(chunkSize);

        const { value: chunk2 } = await reader.read();
        expect(chunk2?.length).toBe(chunkSize);

        const { value: chunk3 } = await reader.read();
        expect(chunk3?.length).toBe(1000);

        const { done } = await reader.read();
        expect(done).toBe(true);
    });

    it('should stream small files in a single chunk', async () => {
        const file = createMockFile(1000);
        const stream = createFileStream(file);
        const reader = stream.getReader();

        const { value: chunk1, done: done1 } = await reader.read();
        expect(chunk1?.length).toBe(1000);
        expect(done1).toBe(false);

        const { done: done2 } = await reader.read();
        expect(done2).toBe(true);
    });

    it('should preserve file content accurately', async () => {
        const originalContent = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        const file = new File([originalContent], 'test.bin', { type: 'application/octet-stream' });

        const stream = createFileStream(file);
        const streamedContent = await readStream(stream);

        expect(streamedContent).toEqual(originalContent);
    });

    it('should handle empty files', async () => {
        const file = createMockFile(0);
        const stream = createFileStream(file);
        const reader = stream.getReader();

        const { done } = await reader.read();
        expect(done).toBe(true);
    });

    it('should support custom chunk sizes', async () => {
        const customChunkSize = 1024;
        const fileSize = customChunkSize * 3 + 500;
        const file = createMockFile(fileSize);

        const stream = createFileStream(file, customChunkSize);
        const reader = stream.getReader();

        const { value: chunk1 } = await reader.read();
        expect(chunk1?.length).toBe(customChunkSize);

        const { value: chunk2 } = await reader.read();
        expect(chunk2?.length).toBe(customChunkSize);

        const { value: chunk3 } = await reader.read();
        expect(chunk3?.length).toBe(customChunkSize);

        const { value: chunk4 } = await reader.read();
        expect(chunk4?.length).toBe(500);

        const { done } = await reader.read();
        expect(done).toBe(true);
    });

    it('should handle stream cancellation', async () => {
        const file = createMockFile(10 * 1024 * 1024);
        const stream = createFileStream(file);
        const reader = stream.getReader();

        await reader.read();

        await reader.cancel();

        const { done } = await reader.read();
        expect(done).toBe(true);
    });

    it('should stream large files without loading entirely into memory', async () => {
        const largeFileSize = 100 * 1024 * 1024;
        const file = createMockFile(largeFileSize);

        const stream = createFileStream(file);
        const reader = stream.getReader();

        let totalBytesRead = 0;
        let chunkCount = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            totalBytesRead += value.length;
            chunkCount++;
        }

        expect(totalBytesRead).toBe(largeFileSize);
        expect(chunkCount).toBe(Math.ceil(largeFileSize / (4 * 1024 * 1024)));
    });

    it('should handle blob.arrayBuffer() errors gracefully', async () => {
        const file = createMockFile(1000);
        const stream = createFileStream(file);
        const reader = stream.getReader();

        const originalArrayBuffer = Blob.prototype.arrayBuffer;
        Blob.prototype.arrayBuffer = jest.fn().mockRejectedValue(new Error('ArrayBuffer failed'));

        await expect(reader.read()).rejects.toThrow('ArrayBuffer failed');

        Blob.prototype.arrayBuffer = originalArrayBuffer;
    });
});
