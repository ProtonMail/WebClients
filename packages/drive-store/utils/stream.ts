export const untilStreamEnd = async <T>(stream: ReadableStream<T>, action?: (data: T) => Promise<void>) => {
    const reader = stream.getReader();

    const processResponse = async (result: ReadableStreamReadResult<T>): Promise<any> => {
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

export const bufferToStream = (buffer: Uint8Array[]): ReadableStream<Uint8Array> => {
    return new ReadableStream({
        start(controller) {
            buffer.forEach((chunk) => controller.enqueue(chunk));
            controller.close();
        },
    });
};
