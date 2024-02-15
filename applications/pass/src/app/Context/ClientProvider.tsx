import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext, useMemo, useRef, useState } from 'react';

import { authStore } from '@proton/pass/lib/auth/store';
import { clientBooted } from '@proton/pass/lib/client';
import { AppStatus, type Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

type ClientState = { status: AppStatus; loggedIn: boolean; localID: Maybe<number>; UID: Maybe<string> };
type ClientContextValue = { state: ClientState; setStatus: (status: AppStatus) => void };

const getInitialClientState = () => ({ loggedIn: false, status: AppStatus.IDLE, localID: undefined, UID: undefined });

export const ClientContext = createContext<ClientContextValue>({
    state: getInitialClientState(),
    setStatus: noop,
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
    const [state, setState] = useState<ClientState>(getInitialClientState);

    return (
        <ClientContext.Provider
            value={useMemo<ClientContextValue>(
                () => ({
                    state,
                    setStatus: (status) =>
                        setState((prev) => {
                            logger.info(`[ClientProvider] Status change : ${prev.status} -> ${status}`);
                            const loggedIn = clientBooted(status);
                            const localID = authStore.getLocalID();
                            const UID = authStore.getUID();

                            return { status, loggedIn, localID, UID };
                        }),
                }),
                [state]
            )}
        >
            {children}
        </ClientContext.Provider>
    );
};
