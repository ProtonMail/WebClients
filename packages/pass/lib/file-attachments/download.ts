import { PassCrypto } from '@proton/pass/lib/crypto';
import type { Callback, FileID, Maybe, ShareId } from '@proton/pass/types';

export const consumeStream = async <T>(stream: ReadableStream<T>, signal: AbortSignal): Promise<Uint8Array> => {
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    const writableStream = new WritableStream({
        write(chunk) {
            chunks.push(chunk);
            totalLength += chunk.length;
        },
    });

    await stream.pipeTo(writableStream, { signal });

    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return result;
};

export const createDownloadStream = (
    shareId: ShareId,
    fileID: FileID,
    chunkIDs: string[],
    /** Chunk request's response body as a stream */
    getChunkStream: (chunkID: string) => Promise<ReadableStream>,
    signal: AbortSignal
): ReadableStream<Uint8Array> => {
    let current = 0;
    let onAbort: Maybe<Callback>;

    return new ReadableStream<Uint8Array>({
        async start(controller) {
            onAbort = () => controller.error(new DOMException('Download aborted', 'AbortError'));

            if (signal?.aborted) onAbort();
            signal?.addEventListener('abort', onAbort, { once: true });
        },

        async pull(controller) {
            if (current >= chunkIDs.length) {
                controller.close();
                return;
            }

            try {
                const stream = await getChunkStream(chunkIDs[current]);
                const encryptedChunk = await consumeStream(stream, signal);
                const chunk = await PassCrypto.openFileChunk({ chunk: encryptedChunk, fileID, shareId });
                controller.enqueue(chunk);
                current++;
            } catch (error) {
                controller.error(error);
            }
        },

        async cancel() {
            if (onAbort) signal?.removeEventListener('abort', onAbort);
        },
    });
};
