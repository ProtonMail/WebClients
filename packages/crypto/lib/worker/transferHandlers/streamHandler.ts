type Data = Uint8Array<ArrayBuffer> | string;
type ChunkWithData<T> = { done: boolean; value?: T };
enum STREAM_CONTROL_TYPE {
    'READ',
    'CANCEL',
}
// Transfer a readable stream chunk by chunk using message channels
export const ReadableStreamSerializer = {
    canHandle: (obj: any): obj is ReadableStream => typeof obj === 'object' && obj.getReader,
    serialize: (readableStream: ReadableStream<Uint8Array<ArrayBuffer>>): MessagePort => {
        const { port1, port2 } = new MessageChannel();

        // wait to get the reader until the first chunk is requested
        // in case the user wants to cancel the stream before starting reading it
        let reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>> | null = null;

        port1.onmessage = async ({ data: { type } }) => {
            switch (type) {
                case STREAM_CONTROL_TYPE.READ:
                    if (reader === null) {
                        reader = readableStream.getReader();
                    }
                    const dataChunk = await reader.read();
                    port1.postMessage(dataChunk, []); // no transferables
                    break;
                case STREAM_CONTROL_TYPE.CANCEL:
                    if (reader) {
                        void reader.cancel();
                    } else {
                        void readableStream.cancel();
                    }
                    break;
                default:
                    throw new Error('Unknown stream transfer control type');
            }
        };

        // Transfer the message channel to the caller's execution context
        return port2; // NB: the port is transferable and must be transferred
    },
    deserialize: <T extends Data>(port: MessagePort): ReadableStream<T> => {
        // Convenience function to allow us to use async/await for messages coming down the port
        const nextPortMessage = () =>
            new Promise<ChunkWithData<T>>((resolve) => {
                port.onmessage = ({ data: chunk }: { data: ChunkWithData<T> }) => {
                    resolve(chunk);
                };
            });

        // Minimal proxy reader
        const portReader = {
            read: () => {
                port.postMessage({ type: STREAM_CONTROL_TYPE.READ });
                // promise that will resolve with the chunk returned by the remote reader
                return nextPortMessage();
            },

            cancel: () => {
                port.postMessage({ type: STREAM_CONTROL_TYPE.CANCEL });
            },
        };

        const reconstructedStream = new ReadableStream<T>({
            async pull(controller) {
                const { done, value } = await portReader.read();
                // When no more data needs to be consumed, close the stream
                if (done) {
                    controller.close();
                    return;
                }
                // Enqueue the next data chunk into our target stream
                controller.enqueue(value);
            },
            cancel() {
                portReader.cancel();
            },
        });

        // // TODO? (not needed for now): make it iterable so it can be used in for-await-of statement
        // reconstructedStream[Symbol.asyncIterator] = () => portReader;

        return reconstructedStream;
    },
};

export type SerializeWebStreamTypes<T> = {
    [I in keyof T]: T[I] extends ReadableStream<Data> | undefined ? MessagePort : T[I];
};
