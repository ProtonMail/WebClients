import { useEffect, useRef, useState } from 'react';

import { useUser } from '@proton/components';
import { ESIndexingState, defaultESIndexingState, estimateIndexingProgress } from '@proton/encrypted-search';
import { SECOND } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

const useEncryptedSearchToggleState = (isOpen: boolean) => {
    const [user] = useUser();
    const { getProgressRecorderRef, getESDBStatus } = useEncryptedSearchContext();
    const { isEnablingContentSearch, isDBLimited, isRefreshing, contentIndexingDone, lastContentTime } =
        getESDBStatus();
    const [esState, setESState] = useState<ESIndexingState>(defaultESIndexingState);

    const abortProgressRef = useRef<AbortController>(new AbortController());

    const setProgress = async (inputESState: ESIndexingState): Promise<void> => {
        let localESState: ESIndexingState = inputESState;
        while (!abortProgressRef.current.signal.aborted) {
            const [esProgress, esTotal] = getProgressRecorderRef().current;
            const endTime = performance.now();

            const { estimatedMinutes, currentProgressValue } = await estimateIndexingProgress(
                user.ID,
                esProgress,
                esTotal,
                endTime,
                localESState
            );

            const newESState: ESIndexingState = {
                ...localESState,
                endTime,
                esProgress,
                totalIndexingItems: esTotal,
                estimatedMinutes: estimatedMinutes || localESState.estimatedMinutes,
                currentProgressValue: currentProgressValue || localESState.currentProgressValue,
            };
            localESState = { ...newESState };

            setESState(() => newESState);
            await wait(2 * SECOND);
        }
    };

    const setOldestTime = async () => {
        if (contentIndexingDone && isDBLimited) {
            const oldestTime = lastContentTime;
            setESState((esState) => {
                return {
                    ...esState,
                    oldestTime,
                };
            });
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
        setESState(() => initialESState);
        await wait(5 * SECOND);
        void setProgress(initialESState);
    };

    const stopProgress = () => {
        abortProgressRef.current.abort();
        setESState(() => defaultESIndexingState);
    };

    useEffect(() => {
        if (isOpen) {
            void setOldestTime();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isEnablingContentSearch || (contentIndexingDone && isRefreshing)) {
            void startProgress();
        } else {
            stopProgress();
        }
        void setOldestTime();
    }, [isEnablingContentSearch, isRefreshing]);

    return esState;
};

export default useEncryptedSearchToggleState;
