import { useEffect, useRef } from 'react';

import { useShallow } from 'zustand/react/shallow';

import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';

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
    const { createNotification } = useNotifications();

    const canUseFreeUpload = useFreeUploadFeature();

    const { refreshSecondsLeft, beginCountdown, abortCountdown } = useFreeUploadStore(
        useShallow((state) => ({
            refreshSecondsLeft: state.refreshSecondsLeft,
            beginCountdown: state.beginCountdown,
            abortCountdown: state.abortCountdown,
        }))
    );

    // In case the kill switch is enabled this can become false during countdown
    // It will cause the clock to stop
    const isFreeUploadInProgress = useIsFreeUploadInProgress();

    const showErrorNotification = useErrorHandler();

    // Check if free upload was started recently
    const { checkFreeUploadTimer } = useFreeUploadApi();
    useEffect(
        function resumeTimer() {
            if (!canUseFreeUpload) {
                return;
            }

            // Available only for users who opened drive for the first time recently
            if (createTime === undefined) {
                return;
            }
            const createTimeMilliseconds = createTime * 1000;
            const hourAndHalfAfterCreation = createTimeMilliseconds + 90 * 60 * 1000;
            if (Date.now() >= hourAndHalfAfterCreation) {
                return;
            }

            checkFreeUploadTimer()
                .then(({ EndTime }) => {
                    if (EndTime !== null) {
                        const endTimeMs = EndTime * 1000;
                        beginCountdown(endTimeMs);
                    }
                })
                .catch((error) => {
                    // No feedback for the user - we don't know if timer is supossed to be resumed or not
                    sendErrorReport(error);
                });
        },
        [beginCountdown, canUseFreeUpload, checkFreeUploadTimer, createNotification, createTime, showErrorNotification]
    );

    const [freeUploadOverModal, showFreeUploadOverModal] = useFreeUploadOverModal();

    // Manage internal timer
    const interval = useRef<Timeout>();
    useEffect(() => {
        if (!isFreeUploadInProgress) {
            if (interval.current) {
                // In case the kill switch is on while the timer has already started
                clearInterval(interval.current);
                interval.current = undefined;
                abortCountdown(); // secondsLeft becomes 0
                showFreeUploadOverModal({});
            }
            return;
        }

        refreshSecondsLeft();
        interval.current = setInterval(() => refreshSecondsLeft(), 1000);
        return () => clearInterval(interval.current);
    }, [abortCountdown, isFreeUploadInProgress, refreshSecondsLeft, showFreeUploadOverModal]);

    return freeUploadOverModal;
}
