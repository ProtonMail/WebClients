import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';

import { sendErrorReport } from '../../../utils/errorHandling';
import { useFreeUploadStore } from '../../../zustand/freeUpload/freeUpload.store';
import { useFreeUploadApi } from './useFreeUploadApi';
import { useFreeUploadFeature } from './useFreeUploadFeature';

export function useInitializeFreeUploadTimer() {
    const { createNotification } = useNotifications();

    const canUseFreeUpload = useFreeUploadFeature();

    const beginFreeUploadCountdown = useFreeUploadStore((state) => state.beginCountdown);

    const { checkOnboardingStatus, startFreeUploadTimer } = useFreeUploadApi();

    const initializeTimer = useCallback(async () => {
        try {
            const { EndTime } = await startFreeUploadTimer();
            if (EndTime !== null) {
                const endTimeMs = EndTime * 1000;
                beginFreeUploadCountdown(endTimeMs);
            } else {
                throw new Error('Free upload end time was null on timer initialization');
            }
        } catch (error) {
            createNotification({
                text: c('Error').t`We're sorry, but free upload is not available right now.`,
                type: 'error',
            });
            sendErrorReport(error);
        }
    }, [beginFreeUploadCountdown, createNotification, startFreeUploadTimer]);

    // See if this user is eligible for the free upload timer
    const [eligibleForFreeUpload, setEligibleForFreeUpload] = useState(false);
    useEffect(() => {
        if (canUseFreeUpload) {
            checkOnboardingStatus()
                .then(({ IsFreshAccount }) => {
                    setEligibleForFreeUpload(IsFreshAccount);
                })
                .catch((error) => {
                    createNotification({
                        text: c('Error').t`We're sorry, but free upload is not available right now.`,
                        type: 'error',
                    });
                    sendErrorReport(error);
                });
        }
    }, [canUseFreeUpload, checkOnboardingStatus, createNotification]);

    return { eligibleForFreeUpload, initializeTimer };
}
