import { TransformStream, ReadableStream, ReadResult } from 'web-streams-polyfill';

export const untilStreamEnd = async <T>(stream: ReadableStream<T>, action?: (data: T) => Promise<void>) => {
    const reader = stream.getReader();

    const processResponse = async (result: ReadResult<T>): Promise<any> => {
        if (result.done) {
            return;
        }

        await action?.(result.value);

        return processResponse(await reader.read());
    };

    return processResponse(await reader.read());
};

export const streamToBuffer = async (stream: ReadableStream<Uint8Array>) => {
    const chunks: Uint8Array[] = [];
    await untilStreamEnd(stream, async (chunk) => {
        chunks.push(chunk);
    });
    return chunks;
};

export class ObserverStream extends TransformStream<Uint8Array, Uint8Array> {
    constructor(fn?: (chunk: Uint8Array) => void) {
        super({
            transform(chunk, controller) {
                fn?.(chunk);
                controller.enqueue(chunk);
            },
        });
    }
}
