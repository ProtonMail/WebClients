import type { ESProgress } from '@proton/encrypted-search/lib';
import { estimateIndexingDuration, readSize } from '@proton/encrypted-search/lib';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import type { Unwrap } from '@proton/shared/lib/interfaces';

import type { IndexedDBRow } from '../esIDB';
import { getIndexingProgressQueryHelpers } from '../esIDB';

/**
 * Compute the estimated time remaining of indexing
 * @param userID the user ID
 * @param totalItems the total number of items to be indexed
 * @param prevProgress the number of indexed items before last iteration
 * @param prevRecordTimestamp the timestamp of the last iteration
 * @param indexedItems the number of indexed items before current iteration
 * @param elapsedTime the timestamp of the current iteration
 * @param indexedDBRow the IDB row in which to store estimation
 * @returns the estimated time to completion (in minutes) and the current progress
 * expressed as a number between 0 and 100
 */
export const estimateIndexingProgress = async (
    userID: string,
    totalItems: number,
    prevProgress: number,
    prevRecordTimestamp: number,
    indexedItems: number,
    elapsedTime: number,
    indexedDBRow?: IndexedDBRow
) => {
    if (totalItems !== 0 && indexedItems !== prevProgress && elapsedTime !== prevRecordTimestamp) {
        const remainingItems = totalItems - indexedItems;

        const estimatedMs = Math.ceil((elapsedTime / indexedItems) * remainingItems);
        const estimatedMinutes = Math.ceil(estimatedMs / MINUTE);

        if (indexedDBRow) {
            await getIndexingProgressQueryHelpers(indexedDBRow).setOriginalEstimate(
                userID,
                Math.ceil(estimatedMs / SECOND)
            );
        }

        const ratioDone = indexedItems / totalItems;
        const currentProgressValue = Math.ceil(ratioDone * 100);

        return { estimatedMinutes, currentProgressValue };
    }
};

const produceIndexingMetrics = async (userID: string, progressBlob: ESProgress) => {
    const { totalItems, isRefreshed, numPauses, timestamps, originalEstimate } = progressBlob;
    const { indexTime, totalInterruptions } = estimateIndexingDuration(timestamps);
    const indexSize = (await readSize(userID)) || 0;

    return {
        numInterruptions: totalInterruptions - numPauses,
        numPauses,
        indexSize,
        originalEstimate,
        indexTime,
        totalItems,
        isRefreshed,
    };
};

export const gatherIndexingMetrics = async (userID: string, row: IndexedDBRow) => {
    const indexingProgress = getIndexingProgressQueryHelpers(row);
    const progressBlob = await indexingProgress.read(userID);
    if (!progressBlob) {
        return;
    }

    return produceIndexingMetrics(userID, progressBlob);
};

export type IndexingMetrics = Unwrap<ReturnType<typeof produceIndexingMetrics>>;
