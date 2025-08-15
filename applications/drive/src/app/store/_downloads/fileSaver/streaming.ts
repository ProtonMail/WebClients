export const getChunkFromBlocksData = (
    range: {
        start: number;
        end: number;
    },
    blocks: Uint8Array<ArrayBuffer>[],
    indices: number[],
    blockSizes: number[]
) => {
    const { start, end } = range;
    const totalLen = blocks.reduce((sum, b) => sum + b.byteLength, 0);
    const concatenated = new Uint8Array(totalLen);
    let pos = 0;
    blocks.forEach((b) => {
        concatenated.set(b, pos);
        pos += b.byteLength;
    });

    const firstOffset = blockSizes.slice(0, indices[0]).reduce((a, b) => a + b, 0);
    const sliceStart = start - firstOffset;
    const chunk = concatenated.subarray(sliceStart, sliceStart + (end - start + 1));
    return chunk;
};

export interface VideoStream {
    blockSizes: number[];
    totalSize: number;
    mimeType: string;
    cache: LRUMap<number, Uint8Array<ArrayBuffer>>;
}

export const parseRange = (rangeHeader: string, videoStream: VideoStream): { start: number; end: number } | null => {
    const m = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
    if (!m) {
        return null;
    }

    const start = parseInt(m[1], 10);
    let end: number;

    if (m[2] === '') {
        // open-ended range: uses the first block size
        // that will be the first bytes send to the video stream
        // most of the time it's enough to get the video metadata
        // if more are needed, browser will make a subsequent request
        const firstBlock = videoStream.blockSizes[0] ?? videoStream.totalSize;
        // clamp so you never go past the real end of file
        end = Math.min(start + firstBlock - 1, videoStream.totalSize - 1);
    } else {
        end = Math.min(parseInt(m[2], 10), videoStream.totalSize - 1);
    }

    return { start, end };
};

export const getBlockIndices = (start: number, end: number, videoStream: VideoStream): number[] => {
    const idx: number[] = [];
    let offset = 0;
    videoStream.blockSizes.forEach((sz, i) => {
        const bs = offset;
        const be = offset + sz - 1;
        if (end >= bs && start <= be) {
            idx.push(i);
        }
        offset += sz;
    });
    return idx;
};

export class LRUMap<K, V> extends Map<K, V> {
    private maxSize: number;

    constructor(maxSize: number) {
        super();
        this.maxSize = maxSize;
    }

    set(key: K, value: V): this {
        if (this.has(key)) {
            this.delete(key);
        } else if (this.size >= this.maxSize) {
            const firstKey = this.keys().next().value;
            if (firstKey !== undefined) {
                this.delete(firstKey);
            }
        }

        super.set(key, value);
        return this;
    }
}
