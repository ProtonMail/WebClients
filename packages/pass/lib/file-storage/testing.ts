import { wait } from '@proton/shared/lib/helpers/promise';

export const createMockChunk = (sizeInBytes: number = 16): Uint8Array => {
    const data = new Uint8Array(sizeInBytes);
    return crypto.getRandomValues(data);
};

export const createMockBlob = (sizeInBytes: number = 16): Blob => {
    return new Blob([createMockChunk(sizeInBytes)]);
};

export const createMockReadableStream = <T>(chunks: T[], timeout: number = 0): ReadableStream<T> => {
    let current = 0;

    const processNextChunk = (controller: ReadableStreamDefaultController<T>) => {
        if (current >= chunks.length) return controller.close();
        controller.enqueue(chunks[current]);
        current++;
    };

    return new ReadableStream<T>({
        start(controller) {
            if (chunks.length > 0 && !timeout) processNextChunk(controller);
            else if (!timeout) controller.close();
        },

        async pull(controller) {
            if (timeout) await wait(timeout);
            processNextChunk(controller);
        },
    });
};

export const createMockErrorStream = <T>(): ReadableStream<T> =>
    new ReadableStream<T>({
        pull: () => {
            throw new Error('Test error');
        },
    });
