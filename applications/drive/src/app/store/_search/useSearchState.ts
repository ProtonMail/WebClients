import { useEffect, useRef, useState } from 'react';

import { useUser } from '@proton/components';
import { ESIndexingState, defaultESIndexingState, estimateIndexingProgress } from '@proton/encrypted-search';
import { SECOND } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useSearchLibrary } from '..';

const useSearchState = () => {
    const [user] = useUser();
    const { getProgressRecorderRef, getESDBStatus } = useSearchLibrary();
    const { isEnablingEncryptedSearch, isRefreshing } = getESDBStatus();
    const [esState, setESState] = useState<ESIndexingState>(defaultESIndexingState);

    const abortProgressRef = useRef<AbortController>(new AbortController());

    const setProgress = async () => {
        while (!abortProgressRef.current.signal.aborted) {
            const [esProgress, esTotal] = getProgressRecorderRef().current;
            const endTime = performance.now();

            const { estimatedMinutes, currentProgressValue } = await estimateIndexingProgress(
                user.ID,
                esProgress,
                esTotal,
                endTime,
                esState,
                false
            );

            setESState((esState) => {
                return {
                    ...esState,
                    endTime,
                    esProgress,
                    totalIndexingItems: esTotal,
                    estimatedMinutes: estimatedMinutes || esState.estimatedMinutes,
                    currentProgressValue: currentProgressValue || esState.currentProgressValue,
                };
            });
            await wait(2 * SECOND);
        }
    };

    const startProgress = async () => {
        abortProgressRef.current = new AbortController();
        const [esPrevProgress, totalIndexingItems] = getProgressRecorderRef().current;
        setESState((esState) => {
            return {
                ...esState,
                startTime: performance.now(),
                esPrevProgress,
                totalIndexingItems,
            };
        });
        await wait(2 * SECOND);
        void setProgress();
    };

    const stopProgress = () => {
        abortProgressRef.current.abort();
        setESState(() => defaultESIndexingState);
    };

    useEffect(() => {
        if (isEnablingEncryptedSearch || isRefreshing) {
            void startProgress();
        } else {
            stopProgress();
        }
    }, [isEnablingEncryptedSearch, isRefreshing]);

    useEffect(() => {
        // Safety stop for situation when the whole component where
        // the hook is used is removed from the DOM.
        return () => stopProgress();
    }, []);

    return esState;
};

export default useSearchState;
