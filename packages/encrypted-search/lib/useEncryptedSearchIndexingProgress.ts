import { useRef, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';

import { defaultESIndexingState as defaultESIndexingProgressState } from './constants';
import { estimateIndexingProgress } from './esHelpers';
import type { ESIndexingState, RecordProgress } from './models';

/**
 * This hook provides helpers related to the progress of the ES indexing
 */
const useEncryptedSearchIndexingProgress = () => {
    const [user] = useUser();

    /**
     * State to display progress indicator in the UI
     */
    const [esIndexingProgressState, setESIndexingProgressState] =
        useState<ESIndexingState>(defaultESIndexingProgressState);

    /**
     * Last record progress to compare with new one
     */
    const progressRecorderRef = useRef<[number, number]>([0, 0]);
    /**
     * Last record timestamp to compare with new one
     */
    const recordTimestampRef = useRef<number | null>(null);

    const recordProgress: RecordProgress = async (newProgress, indexedDbRow) => {
        const [prevProgress, totalItems] = progressRecorderRef.current;
        const prevRecordTimestamp = recordTimestampRef.current;

        const currentRecordTimestamp = performance.now();

        progressRecorderRef.current = Array.isArray(newProgress) ? newProgress : [newProgress, totalItems];
        recordTimestampRef.current = currentRecordTimestamp;

        const [currentProgress] = progressRecorderRef.current;

        if (prevRecordTimestamp && prevProgress) {
            const estimationResult = await estimateIndexingProgress(
                user.ID,
                totalItems,
                prevProgress,
                prevRecordTimestamp,
                currentProgress,
                currentRecordTimestamp,
                indexedDbRow
            );

            if (!estimationResult) {
                return;
            }

            const { estimatedMinutes, currentProgressValue } = estimationResult;

            setESIndexingProgressState((prev) => {
                return {
                    ...prev,
                    esProgress: currentProgress,
                    estimatedMinutes,
                    currentProgressValue,
                    totalIndexingItems: totalItems,
                };
            });
        }
    };

    return { esIndexingProgressState, progressRecorderRef, recordProgress };
};

export default useEncryptedSearchIndexingProgress;
