import { type FC, type PropsWithChildren, createContext, useContext, useMemo, useRef, useState } from 'react';

import { ConnectivityProvider } from '@proton/pass/components/Core/ConnectivityProvider';
import { api } from '@proton/pass/lib/api/api';
import { authStore } from '@proton/pass/lib/auth/store';
import type { AppState } from '@proton/pass/types';
import { AppStatus } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { ping } from '@proton/shared/lib/api/tests';
import noop from '@proton/utils/noop';

export interface ClientContextValue {
    setBooted: (booted: boolean) => void;
    setAuthorized: (authorized: boolean) => void;
    setStatus: (status: AppStatus) => void;
    state: AppState;
}

const getInitialAppState = () => ({
    authorized: false,
    booted: false,
    localID: undefined,
    status: AppStatus.IDLE,
    UID: undefined,
});

export const ClientContext = createContext<ClientContextValue>({
    setBooted: noop,
    setAuthorized: noop,
    setStatus: noop,
    state: getInitialAppState(),
});

export const useClient = (): ClientContextValue => useContext(ClientContext);

/** wraps the client context in a ref when you need to access
 * it outside of the react life-cycle.  */
export const useClientRef = () => {
    const client = useClient();
    const clientRef = useRef(client);
    clientRef.current = client;
    return clientRef;
};

export const ClientProvider: FC<PropsWithChildren> = ({ children }) => {
    const [state, setState] = useState<AppState>(getInitialAppState);

    return (
        <ClientContext.Provider
            value={useMemo<ClientContextValue>(() => {
                const next =
                    <K extends keyof AppState>(key: K) =>
                    (value: AppState[K]) => {
                        if (state[key] !== value) {
                            setState((prev) => {
                                logger.info(`[ClientProvider] ${key} change : ${prev[key]} -> ${value}`);
                                return {
                                    ...prev,
                                    [key]: value,
                                    localID: authStore.getLocalID(),
                                    UID: authStore.getUID(),
                                };
                            });
                        }
                    };

                return {
                    state,
                    setStatus: next('status'),
                    setBooted: next('booted'),
                    setAuthorized: next('authorized'),
                };
            }, [state])}
        >
            <ConnectivityProvider subscribe={api.subscribe} onPing={() => api({ ...ping(), unauthenticated: true })}>
                {children}
            </ConnectivityProvider>
        </ClientContext.Provider>
    );
};
