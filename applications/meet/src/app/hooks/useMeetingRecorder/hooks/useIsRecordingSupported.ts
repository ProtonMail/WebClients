import { useEffect, useState } from 'react';

import { isFirefox, isMobile } from '@proton/shared/lib/helpers/browser';

import { isRecordingStorageAvailable } from '../recordingStorage/isRecordingStorageAvailable';

export const useIsRecordingSupported = () => {
    const [hasRecordingStorage, setHasRecordingStorage] = useState(true);

    useEffect(() => {
        void isRecordingStorageAvailable().then(setHasRecordingStorage);
    }, []);

    return !isFirefox() && !isMobile() && hasRecordingStorage;
};
