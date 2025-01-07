import type { Maybe } from '@proton/pass/types';
import { type AppState, AppStatus } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { withMerge } from '@proton/pass/utils/object/merge';
import type { ObservableState } from '@proton/pass/utils/pubsub/state';
import { createObservableState } from '@proton/pass/utils/pubsub/state';

export const getInitialAppState = (): AppState => ({
    authorized: false,
    booted: false,
    localID: undefined,
    status: AppStatus.IDLE,
    UID: undefined,
});

export type AppStateService = ObservableState<AppState> & {
    reset: () => void;
    setState: (update: Partial<AppState>) => void;
    setAuthorized: (authorized: boolean) => void;
    setBooted: (booted: boolean) => void;
    setLocalID: (localID: Maybe<number>) => void;
    setStatus: (status: AppStatus) => void;
    setUID: (uid: Maybe<string>) => void;
};

const createAppStateService = (): AppStateService => {
    const state = createObservableState<AppState>(getInitialAppState());

    const next =
        <K extends keyof AppState>(key: K) =>
        (value: AppState[K]) => {
            state.setState((prev) => {
                if (prev[key] !== value) {
                    logger.info(`[AppStateProvider] ${key} change : ${prev[key]} -> ${value}`);
                    return { ...prev, [key]: value };
                }

                return prev;
            });
        };

    return {
        ...state,
        setState: (update: Partial<AppState>) => state.setState(withMerge(update)),
        setAuthorized: next('authorized'),
        setBooted: next('booted'),
        setLocalID: next('localID'),
        setStatus: next('status'),
        setUID: next('UID'),
        reset: () => {
            logger.info(`[AppStateProvider] Resetting..`);
            state.setState(getInitialAppState());
        },
    };
};

export const AppStateManager = createAppStateService();
