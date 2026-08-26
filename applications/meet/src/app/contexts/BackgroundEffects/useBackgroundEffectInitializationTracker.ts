import { useCallback } from 'react';

import { useMeetDispatch, useMeetStore } from '@proton/meet/store/hooks';
import type { InitializingBackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import {
    clearBackgroundEffectInitialization,
    finishBackgroundEffectInitialization,
    reportBackgroundEffectFailure,
    selectBackgroundEffectInitializationToken,
    startBackgroundEffectInitialization,
} from '@proton/meet/store/slices/backgroundSlice';

export interface BackgroundEffectInitializationTracker {
    trackBackgroundEffectInitialization: (
        effect: InitializingBackgroundEffect,
        waitUntilApplied: () => Promise<void>
    ) => number;
    cancelBackgroundEffectInitialization: (token?: number) => void;
    reportBackgroundEffectFailure: (effect: InitializingBackgroundEffect) => void;
}

export const useBackgroundEffectInitializationTracker = (): BackgroundEffectInitializationTracker => {
    const dispatch = useMeetDispatch();
    const store = useMeetStore();

    const trackBackgroundEffectInitialization = useCallback(
        (effect: InitializingBackgroundEffect, waitUntilApplied: () => Promise<void>) => {
            dispatch(startBackgroundEffectInitialization(effect));

            // Starting an initialization is what mints the token, so it identifies this pipeline
            // for as long as no other one takes over.
            const token = selectBackgroundEffectInitializationToken(store.getState());

            const track = async () => {
                try {
                    await waitUntilApplied();
                    dispatch(finishBackgroundEffectInitialization(token));
                } catch {
                    dispatch(reportBackgroundEffectFailure({ effect, token }));
                }
            };

            void track();

            return token;
        },
        [dispatch, store]
    );

    const cancelBackgroundEffectInitialization = useCallback(
        (token?: number) => {
            dispatch(clearBackgroundEffectInitialization(token));
        },
        [dispatch]
    );

    const reportFailure = useCallback(
        (effect: InitializingBackgroundEffect) => {
            dispatch(reportBackgroundEffectFailure({ effect }));
        },
        [dispatch]
    );

    return {
        trackBackgroundEffectInitialization,
        cancelBackgroundEffectInitialization,
        reportBackgroundEffectFailure: reportFailure,
    };
};
