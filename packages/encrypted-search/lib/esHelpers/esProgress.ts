import { MINUTE, SECOND } from '@proton/shared/lib/constants';

import { IndexedDBRow, getIndexingProgressQueryHelpers } from '../esIDB';
import { ESIndexingState } from '../models';

/**
 * Compute the estimated time remaining of indexing
 * @param userID the user ID
 * @param esProgress the number of items indexed so far
 * @param esTotal the total number of items to be indexed
 * @param endTime the time when this helper is called
 * @param esState the indexing state, which is a data structure to keep track of
 * indexing progress
 * @returns the estimated time to completion (in minutes) and the current progress
 * expressed as a number between 0 and 100
 */
export const estimateIndexingProgress = async (
    userID: string,
    esProgress: number,
    esTotal: number,
    endTime: number,
    esState: ESIndexingState,
    indexedDBRow?: IndexedDBRow
) => {
    let estimatedMinutes = 0;
    let currentProgressValue = 0;

    if (esTotal !== 0 && endTime !== esState.startTime && esProgress !== esState.esPrevProgress) {
        const remainingItems = esTotal - esProgress;

        if (indexedDBRow) {
            await getIndexingProgressQueryHelpers(indexedDBRow).setOriginalEstimate(
                userID,
                Math.floor(
                    (((endTime - esState.startTime) / (esProgress - esState.esPrevProgress)) * remainingItems) / SECOND
                )
            );
        }

        const processDuration = endTime - esState.startTime;
        const progressDelta = esProgress - esState.esPrevProgress;

        estimatedMinutes = Math.ceil(((processDuration / progressDelta) * remainingItems) / MINUTE);

        const ratioDone = esProgress / esTotal;

        currentProgressValue = Math.ceil(ratioDone * 100);
    }

    return { estimatedMinutes, currentProgressValue };
};
