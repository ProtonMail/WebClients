export interface ChunkStatsSnapshot {
    chunkCount: number;
    emptyChunkCount: number;
    firstChunkAt: number | null;
    lastChunkAt: number;
}

export interface ChunkStats {
    snapshot(): ChunkStatsSnapshot;
    recordChunk(size: number): { isFirst: boolean; chunkNumber: number };
    recordEmpty(): number;
    reset(): void;
}

export const createChunkStats = (): ChunkStats => {
    let chunkCount = 0;
    let emptyChunkCount = 0;
    let firstChunkAt: number | null = null;
    let lastChunkAt = 0;

    return {
        snapshot: () => ({ chunkCount, emptyChunkCount, firstChunkAt, lastChunkAt }),
        recordChunk: () => {
            chunkCount += 1;
            lastChunkAt = performance.now();
            const isFirst = firstChunkAt === null;
            if (isFirst) {
                firstChunkAt = lastChunkAt;
            }
            return { isFirst, chunkNumber: chunkCount };
        },
        recordEmpty: () => {
            emptyChunkCount += 1;
            return emptyChunkCount;
        },
        reset: () => {
            chunkCount = 0;
            emptyChunkCount = 0;
            firstChunkAt = null;
            lastChunkAt = 0;
        },
    };
};
