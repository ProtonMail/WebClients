import { useCallback, useEffect, useState } from 'react';

import { sendErrorReport } from '../../../utils/errorHandling';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { useFreeUploadStore } from '../../../zustand/freeUpload/freeUpload.store';
import { useFreeUploadApi } from './useFreeUploadApi';
import { useFreeUploadFeature } from './useFreeUploadFeature';

export function useInitializeFreeUploadTimer() {
    const canUseFreeUpload = useFreeUploadFeature();

    const beginFreeUploadCountdown = useFreeUploadStore((state) => state.beginCountdown);

    const { checkOnboardingStatus, startFreeUploadTimer } = useFreeUploadApi();

    const initializeTimer = useCallback(() => {
        startFreeUploadTimer()
            .then(({ EndTime }) => {
                if (EndTime !== null) {
                    beginFreeUploadCountdown(EndTime * 1000); // convert seconds to milliseconds
                } else {
                    throw new EnrichedError('Cannot start free upload timer');
                }
            })
            .catch(sendErrorReport);
    }, [beginFreeUploadCountdown, startFreeUploadTimer]);

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
