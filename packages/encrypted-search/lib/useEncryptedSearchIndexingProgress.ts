import { useRef, useState } from 'react';

import { useUser } from '@proton/components/hooks';

import { defaultESIndexingState as defaultESIndexingProgressState } from './constants';
import { estimateIndexingProgress } from './esHelpers';
import { IndexedDBRow } from './esIDB';
import { ESIndexingState } from './models';

/**
 * This hook provides helpers related to the progress of the ES indexing
 */
const useEncryptedSearchIndexingProgress = () => {
    const [user] = useUser();
    const [esIndexingProgressState, setESIndexingProgressState] =
        useState<ESIndexingState>(defaultESIndexingProgressState);

    // Allow to track progress during indexing or refreshing
    const progressRecorderRef = useRef<[number, number]>([0, 0]);

    const recordProgress = async (progress: [number, number], indexedDbRow?: IndexedDBRow) => {
        let localESState: ESIndexingState = { ...esIndexingProgressState };
        progressRecorderRef.current = progress;

        const [esProgress, esTotal] = progress;

        const endTime = performance.now();

        const { estimatedMinutes, currentProgressValue } = await estimateIndexingProgress(
            user.ID,
            esProgress,
            esTotal,
            endTime,
            localESState,
            indexedDbRow
        );

        setESIndexingProgressState((prev) => ({
            ...prev,
            endTime,
            esProgress,
            totalIndexingItems: esTotal,
            estimatedMinutes: estimatedMinutes,
            currentProgressValue: currentProgressValue,
        }));
    };

    return { esIndexingProgressState, progressRecorderRef, recordProgress };
};

export default useEncryptedSearchIndexingProgress;
