import { useEffect, useRef, useState } from 'react';
import { useUser } from '@proton/components';
import { wait } from '@proton/shared/lib/helpers/promise';
import { SECOND } from '@proton/shared/lib/constants';

import { getOldestTime, wasIndexingDone } from '../../helpers/encryptedSearch/esUtils';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { ESIndexingState } from '../../models/encryptedSearch';
import { defaultESIndexingState } from '../../constants';
import { estimateIndexingProgress } from '../../helpers/encryptedSearch/esBuild';

const useEncryptedSearchToggleState = (isOpen: boolean) => {
    const [user] = useUser();
    const { getProgressRecorderRef, getESDBStatus } = useEncryptedSearchContext();
    const { isBuilding, isDBLimited, isRefreshing } = getESDBStatus();
    const [esState, setESState] = useState<ESIndexingState>(defaultESIndexingState);

    const abortProgressRef = useRef<AbortController>(new AbortController());

    const setProgress = async () => {
        while (!abortProgressRef.current.signal.aborted) {
            setESState((esState) => {
                const [esProgress, esTotal] = getProgressRecorderRef().current;
                const endTime = performance.now();

                const { estimatedMinutes, currentProgressValue } = estimateIndexingProgress(
                    user.ID,
                    esProgress,
                    esTotal,
                    endTime,
                    esState
                );

                return {
                    ...esState,
                    endTime,
                    esProgress,
                    totalIndexingMessages: esTotal,
                    estimatedMinutes: estimatedMinutes || esState.estimatedMinutes,
                    currentProgressValue: currentProgressValue || esState.currentProgressValue,
                };
            });
            await wait(2 * SECOND);
        }
    };

    const setOldestTime = async () => {
        if (wasIndexingDone(user.ID) && isDBLimited) {
            const oldestTime = await getOldestTime(user.ID, 1000);
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
        const [esPrevProgress, totalIndexingMessages] = getProgressRecorderRef().current;
        setESState((esState) => {
            return {
                ...esState,
                startTime: performance.now(),
                esPrevProgress,
                totalIndexingMessages,
            };
        });
        await wait(5 * SECOND);
        void setProgress();
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
        if (isBuilding || isRefreshing) {
            void startProgress();
        } else {
            stopProgress();
        }
        void setOldestTime();
    }, [isBuilding, isRefreshing]);

    return esState;
};

export default useEncryptedSearchToggleState;
