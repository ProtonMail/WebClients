import { useEffect } from 'react';

import noop from '@proton/utils/noop';

export const useWakeLock = () => {
    const turnOnWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                const wakeLock = await navigator.wakeLock.request('screen');
                return () => {
                    void wakeLock.release();
                };
            } catch (error) {
                return noop;
            }
        }

        return noop;
    };

    useEffect(() => {
        let releaseWakeLock: () => void;

        const enableWakeLock = async () => {
            releaseWakeLock = await turnOnWakeLock();
        };

        void enableWakeLock();

        return () => {
            if (releaseWakeLock) {
                releaseWakeLock();
            }
        };
    }, []);
};
