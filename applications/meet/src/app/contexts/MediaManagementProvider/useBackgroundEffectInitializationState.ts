import { useCallback, useRef, useState } from 'react';

// Which effect a pipeline is warming up for, so the UI can name it correctly.
export type InitializingBackgroundEffect = 'blur' | 'virtualBackground';

export interface BackgroundEffectInitializationState {
    initializingBackgroundEffect: InitializingBackgroundEffect | null;
    failedBackgroundEffect: InitializingBackgroundEffect | null;
    trackBackgroundEffectInitialization: (
        effect: InitializingBackgroundEffect,
        waitUntilApplied: () => Promise<void>
    ) => number;
    cancelBackgroundEffectInitialization: (token?: number) => void;
    reportBackgroundEffectFailure: (effect: InitializingBackgroundEffect) => void;
}

export const useBackgroundEffectInitializationState = (): BackgroundEffectInitializationState => {
    const [initializingBackgroundEffect, setInitializingBackgroundEffect] =
        useState<InitializingBackgroundEffect | null>(null);
    const [failedBackgroundEffect, setFailedBackgroundEffect] = useState<InitializingBackgroundEffect | null>(null);
    const initToken = useRef(0);

    const trackBackgroundEffectInitialization = useCallback(
        (effect: InitializingBackgroundEffect, waitUntilApplied: () => Promise<void>) => {
            const token = ++initToken.current;
            setInitializingBackgroundEffect(effect);
            setFailedBackgroundEffect(null);

            const track = async () => {
                try {
                    await waitUntilApplied();
                    if (initToken.current === token) {
                        setInitializingBackgroundEffect(null);
                    }
                } catch {
                    if (initToken.current === token) {
                        setInitializingBackgroundEffect(null);
                        setFailedBackgroundEffect(effect);
                    }
                }
            };

            void track();

            return token;
        },
        []
    );

    const cancelBackgroundEffectInitialization = useCallback((token?: number) => {
        if (token !== undefined && token !== initToken.current) {
            return;
        }
        initToken.current++;
        setInitializingBackgroundEffect(null);
        setFailedBackgroundEffect(null);
    }, []);

    const reportBackgroundEffectFailure = useCallback((effect: InitializingBackgroundEffect) => {
        initToken.current++;
        setInitializingBackgroundEffect(null);
        setFailedBackgroundEffect(effect);
    }, []);

    return {
        initializingBackgroundEffect,
        failedBackgroundEffect,
        trackBackgroundEffectInitialization,
        cancelBackgroundEffectInitialization,
        reportBackgroundEffectFailure,
    };
};
