import { useEffect, useRef } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { useFreeUploadOverModal } from '../../../modals/FreeUploadOverModal/useFreeUploadOverModal';
import { sendErrorReport } from '../../../utils/errorHandling';
import { useFreeUploadStore } from '../../../zustand/freeUpload/freeUpload.store';
import { useFreeUploadApi } from './useFreeUploadApi';
import { useFreeUploadFeature } from './useFreeUploadFeature';
import { useIsFreeUploadInProgress } from './useIsFreeUploadInProgress';

type Timeout = ReturnType<typeof setTimeout>;

/**
 * Checks if free upload timer is running on BE.
 * Starts local (frontend-only) timer according to what BE returns.
 *
 * @returns modal that will show when the countdown reaches zero
 */
export function useRunningFreeUploadTimer(createTime?: number) {
    const canUseFreeUpload = useFreeUploadFeature();

    const { secondsLeft, refreshSecondsLeft, beginCountdown, abortCountdown } = useFreeUploadStore(
        useShallow((state) => ({
            secondsLeft: state.secondsLeft,
            refreshSecondsLeft: state.refreshSecondsLeft,
            beginCountdown: state.beginCountdown,
            abortCountdown: state.abortCountdown,
        }))
    );

    // In case the kill switch is enabled this can become false during countdown
    // It will cause the clock to stop
    const isFreeUploadInProgress = useIsFreeUploadInProgress();

    // Check if free upload was started recently
    const { checkFreeUploadTimer } = useFreeUploadApi();
    useEffect(() => {
        if (!canUseFreeUpload) {
            return;
        }

        // Available only for users who opened drive for the first time recently
        if (!createTime) {
            return;
        }
        const createTimeMilliseconds = createTime * 1000;
        const hourAndHalfAfterCreation = 90 * 60 * 1000 + createTimeMilliseconds;
        if (Date.now() > hourAndHalfAfterCreation) {
            return;
        }

        checkFreeUploadTimer()
            .then(({ EndTime }) => {
                if (EndTime !== null) {
                    beginCountdown(EndTime * 1000); // convert seconds to milliseconds
                }
            })
            .catch(sendErrorReport);
    }, [beginCountdown, checkFreeUploadTimer, createTime]);

    // Manage internal timer
    const interval = useRef<Timeout>();
    useEffect(() => {
        if (!isFreeUploadInProgress) {
            if (interval.current) {
                // In case the kill switch is on while the timer has already started
                clearInterval(interval.current);
                interval.current = undefined;
                abortCountdown(); // secondsLeft becomes 0 and onTimerEnd is called
            }
            return;
        }

        refreshSecondsLeft();
        interval.current = setInterval(() => refreshSecondsLeft(), 1000);
        return () => clearInterval(interval.current);
    }, [abortCountdown, isFreeUploadInProgress, refreshSecondsLeft]);

    // Manage "free upload over" modal
    const [freeUploadOverModal, showFreeUploadOverModal] = useFreeUploadOverModal();
    // Make modal visible when time is up
    useEffect(() => {
        if (secondsLeft === 0) {
            showFreeUploadOverModal({});
        }
    }, [secondsLeft, showFreeUploadOverModal]);

    return freeUploadOverModal;
}
