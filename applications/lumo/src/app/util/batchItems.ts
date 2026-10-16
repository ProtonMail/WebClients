/**
 * Splits a flat list into batches of at most `batchSize` items (last batch may be shorter).
 *
 * @param items - The items to batch.
 * @param batchSize - The size of each batch.
 * @returns The batches.
 */
export const batchItems = <T>(items: readonly T[], batchSize: number): T[][] => {
    if (batchSize <= 0) {
        return [];
    }

    return items.reduce<T[][]>((batches, item, index) => {
        const batchIndex = Math.floor(index / batchSize);
        if (!batches[batchIndex]) {
            batches[batchIndex] = [];
        }
        batches[batchIndex].push(item);
        return batches;
    }, []);
};
