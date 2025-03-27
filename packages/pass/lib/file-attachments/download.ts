import { PassCrypto } from '@proton/pass/lib/crypto';
import type { FileID } from '@proton/pass/types';

export const consumeStream = async (
    reader: ReadableStreamDefaultReader,
    chunks: Uint8Array[] = [],
    totalLength: number = 0
): Promise<Uint8Array> => {
    const { done, value } = await reader.read();
    if (!done) return consumeStream(reader, [...chunks, value], totalLength + value.length);

    return chunks.reduce<[Uint8Array, number]>(
        ([res, offset], chunk) => {
            res.set(chunk, offset);
            return [res, offset + chunk.length];
        },
        [new Uint8Array(totalLength), 0]
    )[0];
};

export const createDownloadStream = (
    fileID: FileID,
    chunkIDs: string[],
    getChunkStream: (chunkID: string) => Promise<ReadableStream>,
    signal?: AbortSignal
): ReadableStream<Uint8Array> => {
    let current = 0;

    return new ReadableStream<Uint8Array>({
        async start(controller) {
            const onAbort = () => controller.error(new DOMException('Download aborted', 'AbortError'));
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
                const encryptedChunk = await consumeStream(stream.getReader());
                const chunk = await PassCrypto.openFileChunk({ chunk: encryptedChunk, fileID });
                controller.enqueue(chunk);
                current++;
            } catch (error) {
                controller.error(error);
            }
        },
    });
};
