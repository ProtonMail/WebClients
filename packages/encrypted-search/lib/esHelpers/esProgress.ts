import { MINUTE, SECOND } from '@proton/shared/lib/constants';

import { IndexedDBRow, getIndexingProgressQueryHelpers } from '../esIDB';

/**
 * Compute the estimated time remaining of indexing
 * @param userID the user ID
 * @param esTotal the total number of items to be indexed
 * @param prevProgress the number of indexed items before last iteration
 * @param prevRecordTimestamp the timestamp of the last iteration
 * @param currentProgress the number of indexed items before current iteration
 * @param currentRecordTimestamp the timestamp of the current iteration
 * @param esIndexingState the IDB row in which to store estimation
 * @returns the estimated time to completion (in minutes) and the current progress
 * expressed as a number between 0 and 100
 */
export const estimateIndexingProgress = async (
    userID: string,
    esTotal: number,
    prevProgress: number,
    prevRecordTimestamp: number,
    currentProgress: number,
    currentRecordTimestamp: number,
    indexedDBRow?: IndexedDBRow
) => {
    if (esTotal !== 0 && currentProgress !== prevProgress && currentRecordTimestamp !== prevRecordTimestamp) {
        const remainingItems = esTotal - currentProgress;

        const processDuration = currentRecordTimestamp - prevRecordTimestamp;
        const progressDelta = currentProgress - prevProgress;

        const estimatedMs = Math.ceil((processDuration / progressDelta) * remainingItems);
        const estimatedMinutes = Math.ceil(estimatedMs / MINUTE);

        if (indexedDBRow) {
            await getIndexingProgressQueryHelpers(indexedDBRow).setOriginalEstimate(
                userID,
                Math.ceil(estimatedMs / SECOND)
            );
        }

        const ratioDone = currentProgress / esTotal;
        const currentProgressValue = Math.ceil(ratioDone * 100);

        return { estimatedMinutes, currentProgressValue };
    }
};
