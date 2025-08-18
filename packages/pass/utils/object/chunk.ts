import { sortOn } from '@proton/pass/utils/fp/sort';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

export type Chunk = {
    /** batch identifier */
    streamID: string;
    /** current chunk index */
    index: number;
    /** total number of chunks */
    total: number;
    /** b64 data for the chunk */
    chunk: string;
    /* byteSize of the chunk */
    size: number;
};

/** 1MB max chunks */
const MAX_CHUNK_SIZE = 1024 * 1024;

/** Chunks will be transmitted over port messaging which
 * do not support transferable ArrayBuffers in extensions.
 * As such, resort to base64 encoding of the chunks */
export function* toChunks(state: object, chunkSize: number = MAX_CHUNK_SIZE): Generator<Chunk> {
    const streamID = uniqueId();
    const str = JSON.stringify(state);
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const { byteLength } = data;

    let index = 0;
    const total = Math.ceil(byteLength / chunkSize);

    for (let offset = 0; offset < byteLength; offset += chunkSize) {
        const size = Math.min(chunkSize, byteLength - offset);
        const buffer = new Uint8Array(size);
        buffer.set(data.subarray(offset, offset + size));
        const chunk = uint8ArrayToBase64String(buffer);

        yield { streamID, index: index++, chunk, size, total };
    }
}

export const fromChunks = <T = object>(chunks: Chunk[]): T => {
    if (chunks.length === 0) throw new Error('Empty chunks');
    if (chunks.length !== chunks[0].total) throw new Error('Missing chunks');

    const base = chunks[0];

    /** Ensure the chunks are in the correct order */
    const sortedChunks = chunks.sort(sortOn('index', 'ASC'));
    const size = chunks.reduce((total, { size }) => total + size, 0);
    const data = new Uint8Array(size);

    let offset = 0;

    for (const { chunk, size, streamID } of sortedChunks) {
        if (base.streamID !== streamID) throw new Error('Invalid chunk');
        const buffer = base64StringToUint8Array(chunk);
        data.set(buffer, offset);
        offset += size;
    }

    const decoder = new TextDecoder('utf-8');
    const str = decoder.decode(data);

    return JSON.parse(str) as T;
};
