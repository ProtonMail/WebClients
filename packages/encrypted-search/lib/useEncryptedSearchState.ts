import { useEffect, useRef, useState } from 'react';

import { useUser } from '@proton/components/hooks';
import { SECOND } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { defaultESIndexingState } from './constants';
import { estimateIndexingProgress } from './esHelpers';
import { ESIndexingState, ESTimepoint } from './models';

interface Props {
    isIndexing: boolean;
    getProgressRecorderRef: () => { current: ESTimepoint };
    shouldPersistEstimation?: boolean;
}

/**
 * This hook provides helpers related to the progress of the ES indexing
 */
const useEncryptedSearchState = ({ isIndexing, getProgressRecorderRef, shouldPersistEstimation }: Props) => {
    const [user] = useUser();
    const [esState, setESState] = useState<ESIndexingState>(defaultESIndexingState);

    const abortProgressRef = useRef<AbortController>(new AbortController());

    const pollProgress = async (inputESState: ESIndexingState) => {
        let localESState: ESIndexingState = inputESState;
        while (!abortProgressRef.current.signal.aborted) {
            const [esProgress, esTotal] = getProgressRecorderRef().current;
            const endTime = performance.now();

            const { estimatedMinutes, currentProgressValue } = await estimateIndexingProgress(
                user.ID,
                esProgress,
                esTotal,
                endTime,
                localESState,
                Boolean(shouldPersistEstimation)
            );

            const newESState: ESIndexingState = {
                ...localESState,
                endTime,
                esProgress,
                totalIndexingItems: esTotal,
                estimatedMinutes: estimatedMinutes ?? localESState.estimatedMinutes,
                currentProgressValue: currentProgressValue || localESState.currentProgressValue,
            };

            localESState = { ...newESState };
            setESState(newESState);

            await wait(2 * SECOND);
        }
    };

    const startProgress = async () => {
        abortProgressRef.current = new AbortController();
        const [esPrevProgress, totalIndexingItems] = getProgressRecorderRef().current;

        const initialESState: ESIndexingState = {
            ...esState,
            startTime: performance.now(),
            esPrevProgress,
            esProgress: esPrevProgress,
            totalIndexingItems,
        };

        setESState(initialESState);
        await wait(5 * SECOND);
        void pollProgress(initialESState);
    };

    const stopProgress = () => {
        abortProgressRef.current.abort();
        setESState(() => defaultESIndexingState);
    };

    const setOldestTime = async (oldestTime: number) => {
        setESState((esState) => {
            return {
                ...esState,
                oldestTime,
            };
        });
    };

    useEffect(() => {
        if (isIndexing) {
            void startProgress();
        } else {
            stopProgress();
        }
    }, [isIndexing]);

    useEffect(() => {
        // Safety stop for situation when the whole component where
        // the hook is used is removed from the DOM.
        return () => stopProgress();
    }, []);

    return { esState, setOldestTime };
};

export default useEncryptedSearchState;
