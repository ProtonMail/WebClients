import { type FC, type PropsWithChildren, createContext, useMemo, useState } from 'react';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { AppState, Maybe, MaybeNull } from '@proton/pass/types';
import { AppStatus } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { withMerge } from '@proton/pass/utils/object/merge';

export interface AppStateContextValue {
    state: AppState;
    reset: () => void;
    setState: (update: Partial<AppState>) => void;
    setAuthorized: (authorized: boolean) => void;
    setBooted: (booted: boolean) => void;
    setLocalID: (localID: Maybe<number>) => void;
    setStatus: (status: AppStatus) => void;
    setUID: (uid: Maybe<string>) => void;
}

export const getInitialAppState = (): AppState => ({
    authorized: false,
    booted: false,
    localID: undefined,
    status: AppStatus.IDLE,
    UID: undefined,
});

export const AppStateContext = createContext<MaybeNull<AppStateContextValue>>(null);
export const useAppState = createUseContext(AppStateContext);

type Props = PropsWithChildren<{ initial?: AppState }>;

export const AppStateProvider: FC<Props> = ({ initial, children }) => {
    const [state, setState] = useState<AppState>(initial ?? getInitialAppState);

    return (
        <AppStateContext.Provider
            value={useMemo<AppStateContextValue>(() => {
                const next =
                    <K extends keyof AppState>(key: K) =>
                    (value: AppState[K]) => {
                        setState((prev) => {
                            if (prev[key] !== value) {
                                logger.info(`[AppStateProvider] ${key} change : ${prev[key]} -> ${value}`);
                                return { ...prev, [key]: value };
                            }

                            return prev;
                        });
                    };

                return {
                    state,
                    reset: () => {
                        logger.info(`[AppStateProvider] Resetting..`);
                        setState(getInitialAppState());
                    },
                    setState: (update) => setState(withMerge(update)),
                    setAuthorized: next('authorized'),
                    setBooted: next('booted'),
                    setLocalID: next('localID'),
                    setStatus: next('status'),
                    setUID: next('UID'),
                };
            }, [state])}
        >
            {children}
        </AppStateContext.Provider>
    );
};
