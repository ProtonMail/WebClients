import { TransformStream } from 'web-streams-polyfill';
import { noop } from 'proton-shared/lib/helpers/function';

export const untilStreamEnd = async <T>(stream: ReadableStream<T>, action: (data: T) => Promise<void>) => {
    const reader = stream.getReader();

    const processResponse = async ({ done, value }: ReadableStreamReadResult<T>): Promise<any> => {
        if (done) {
            return;
        }

        action(value);

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
    constructor(fn: (chunk: Uint8Array) => void = noop) {
        super({
            transform(chunk, controller) {
                fn(chunk);
                controller.enqueue(chunk);
            }
        });
    }
}
