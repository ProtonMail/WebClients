import { PassCrypto } from '@proton/pass/lib/crypto';
import type { Callback, FileID, Maybe, ShareId } from '@proton/pass/types';

export const consumeStream = async <T>(stream: ReadableStream<T>, signal: AbortSignal): Promise<Uint8Array<ArrayBuffer>> => {
    const chunks: Uint8Array<ArrayBuffer>[] = [];
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
    options: {
        shareId: ShareId;
        fileID: FileID;
        chunkIDs: string[];
        encryptionVersion: number;
    },
    /** Chunk request's response body as a stream */
    getChunkStream: (chunkID: string) => Promise<ReadableStream>,
    signal: AbortSignal
): ReadableStream<Uint8Array<ArrayBuffer>> => {
    const { shareId, fileID, chunkIDs, encryptionVersion } = options;
    let chunkIndex = 0;
    let onAbort: Maybe<Callback>;

    return new ReadableStream<Uint8Array<ArrayBuffer>>({
        async start(controller) {
            onAbort = () => controller.error(new DOMException('Download aborted', 'AbortError'));

            if (signal?.aborted) onAbort();
            signal?.addEventListener('abort', onAbort, { once: true });
        },

        async pull(controller) {
            if (chunkIndex >= chunkIDs.length) {
                controller.close();
                return;
            }

            try {
                const stream = await getChunkStream(chunkIDs[chunkIndex]);
                const encryptedChunk = await consumeStream(stream, signal);
                const chunk = await PassCrypto.openFileChunk({
                    chunk: encryptedChunk,
                    chunkIndex,
                    encryptionVersion,
                    fileID,
                    shareId,
                    totalChunks: chunkIDs.length,
                });

                controller.enqueue(chunk);
                chunkIndex++;
            } catch (error) {
                controller.error(error);
            }
        },

        async cancel() {
            if (onAbort) signal?.removeEventListener('abort', onAbort);
        },
    });
};
