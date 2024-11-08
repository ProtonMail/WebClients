import { useRef, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import type { IndexedDBRow } from '@proton/encrypted-search/lib/esIDB';

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

    /**
     * Start fetching content step timestamp
     */
    const indexingStartTimestampRef = useRef<number | null>(null);

    /**
     * Ref of the previous DB row (metadata or content fetch)
     */
    const previousDBRowRef = useRef<IndexedDBRow | null>('metadata');

    const recordProgress: RecordProgress = async (newProgress, indexedDbRow) => {
        const currentRecordTimestamp = performance.now();

        // When switching from metadata fetch to the content fetch (which is the indexing step that needs to be displayed to the user),
        // set the indexing start time, and reset the record timestamp
        if (indexedDbRow && indexedDbRow !== previousDBRowRef.current) {
            previousDBRowRef.current = indexedDbRow;
            recordTimestampRef.current = currentRecordTimestamp;
            indexingStartTimestampRef.current = currentRecordTimestamp;
        }
        const [prevProgress, totalItems] = progressRecorderRef.current;
        const prevRecordTimestamp = recordTimestampRef.current;

        progressRecorderRef.current = Array.isArray(newProgress) ? newProgress : [newProgress, totalItems];
        recordTimestampRef.current = currentRecordTimestamp;

        const [currentProgress] = progressRecorderRef.current;
        const startTimestamp = indexingStartTimestampRef.current || 0;
        const elapsedTime = currentRecordTimestamp - startTimestamp;

        if (prevRecordTimestamp && prevProgress) {
            const estimationResult = await estimateIndexingProgress(
                user.ID,
                totalItems,
                prevProgress,
                prevRecordTimestamp,
                currentProgress,
                elapsedTime,
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
