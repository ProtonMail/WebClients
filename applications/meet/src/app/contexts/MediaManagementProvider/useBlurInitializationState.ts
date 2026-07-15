import { useCallback, useRef, useState } from 'react';

export interface BlurInitializationState {
    isBackgroundBlurInitializing: boolean;
    isBackgroundBlurInitializationFailed: boolean;
    trackBlurInitialization: (waitUntilBlurApplied: () => Promise<void>) => number;
    cancelBlurInitialization: (token?: number) => void;
}

export const useBlurInitializationState = (): BlurInitializationState => {
    const [isBackgroundBlurInitializing, setIsBackgroundBlurInitializing] = useState(false);
    const [isBackgroundBlurInitializationFailed, setIsBackgroundBlurInitializationFailed] = useState(false);
    const blurInitToken = useRef(0);

    const trackBlurInitialization = useCallback((waitUntilBlurApplied: () => Promise<void>) => {
        const token = ++blurInitToken.current;
        setIsBackgroundBlurInitializing(true);
        setIsBackgroundBlurInitializationFailed(false);

        const track = async () => {
            try {
                await waitUntilBlurApplied();
                if (blurInitToken.current === token) {
                    setIsBackgroundBlurInitializing(false);
                }
            } catch {
                if (blurInitToken.current === token) {
                    setIsBackgroundBlurInitializing(false);
                    setIsBackgroundBlurInitializationFailed(true);
                }
            }
        };

        void track();

        return token;
    }, []);

    const cancelBlurInitialization = useCallback((token?: number) => {
        if (token !== undefined && token !== blurInitToken.current) {
            return;
        }
        blurInitToken.current++;
        setIsBackgroundBlurInitializing(false);
        setIsBackgroundBlurInitializationFailed(false);
    }, []);

    return {
        isBackgroundBlurInitializing,
        isBackgroundBlurInitializationFailed,
        trackBlurInitialization,
        cancelBlurInitialization,
    };
};
