import { useCallback, useEffect, useState } from 'react';

import addMinutes from 'date-fns/addMinutes';
import isAfter from 'date-fns/isAfter';
import isBefore from 'date-fns/isBefore';
import { c } from 'ttag';

import useErrorHandler from '@proton/components/hooks/useErrorHandler';

import { sendErrorReport } from '../../../utils/errorHandling';
import { useFreeUploadStore } from '../../../zustand/freeUpload/freeUpload.store';
import { useFreeUploadApi } from './useFreeUploadApi';
import { useFreeUploadFeature } from './useFreeUploadFeature';

export function useInitializeFreeUploadTimer() {
    const canUseFreeUpload = useFreeUploadFeature();

    const beginFreeUploadCountdown = useFreeUploadStore((state) => state.beginCountdown);

    const { checkOnboardingStatus, startFreeUploadTimer } = useFreeUploadApi();

    const showErrorNotification = useErrorHandler();

    const initializeTimer = useCallback(() => {
        return startFreeUploadTimer()
            .then(({ EndTime }) => {
                if (EndTime !== null) {
                    const endTimeMs = EndTime * 1000;
                    if (isAfter(endTimeMs, addMinutes(new Date(), 10))) {
                        const error = new Error(c('Error').t`We're sorry, but free upload is not available right now.`);
                        showErrorNotification(error);
                        throw error;
                    } else if (isBefore(endTimeMs, addMinutes(new Date(), 9))) {
                        const error = new Error(c('Error').t`We're sorry, but free upload is not available right now.`);
                        showErrorNotification(error);
                        throw error;
                    }
                    beginFreeUploadCountdown(endTimeMs);
                } else {
                    throw new Error('Cannot start free upload timer');
                }
            })
            .catch(sendErrorReport);
    }, [beginFreeUploadCountdown, showErrorNotification, startFreeUploadTimer]);

    // See if this user is eligible for the free upload timer
    const [eligibleForFreeUpload, setEligibleForFreeUpload] = useState(false);
    useEffect(() => {
        if (canUseFreeUpload) {
            checkOnboardingStatus()
                .then(({ IsFreshAccount }) => {
                    setEligibleForFreeUpload(IsFreshAccount);
                })
                .catch(sendErrorReport);
        }
    }, [canUseFreeUpload, checkOnboardingStatus]);

    return { eligibleForFreeUpload, initializeTimer };
}
