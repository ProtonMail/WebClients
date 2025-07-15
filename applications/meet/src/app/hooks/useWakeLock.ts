import { useCallback, useEffect } from 'react';

import noop from '@proton/utils/noop';

export const useWakeLock = () => {
    const turnOnWakeLock = useCallback(async () => {
        if ('wakeLock' in navigator) {
            const wakeLock = await navigator.wakeLock.request('screen');
            return () => {
                void wakeLock.release();
            };
        }

        return noop;
    }, []);

    useEffect(() => {
        let releaseWakeLock: () => void;

        const enableWakeLock = async () => {
            releaseWakeLock = await turnOnWakeLock();
        };

        enableWakeLock();

        return () => {
            if (releaseWakeLock) {
                releaseWakeLock();
            }
        };
    }, []);
};
