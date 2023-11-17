import { type FC, createContext, useContext, useMemo, useState } from 'react';

import { clientReady } from '@proton/pass/lib/client';
import { AppStatus, type Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import { authStore } from '../../lib/core';

type ClientState = { status: AppStatus; loggedIn: boolean; localID: Maybe<number>; UID: Maybe<string> };
type ClientContextValue = { state: ClientState; setStatus: (status: AppStatus) => void };

const getInitialClientState = () => ({ loggedIn: false, status: AppStatus.IDLE, localID: undefined, UID: undefined });

export const ClientContext = createContext<ClientContextValue>({
    state: getInitialClientState(),
    setStatus: noop,
});

export const useClient = (): ClientContextValue => useContext(ClientContext);

export const ClientProvider: FC = ({ children }) => {
    const [state, setState] = useState<ClientState>(getInitialClientState);

    return (
        <ClientContext.Provider
            value={useMemo<ClientContextValue>(
                () => ({
                    state,
                    setStatus: (status) =>
                        setState((prev) => {
                            logger.info(`[ClientContext] Status change : ${prev.status} -> ${status}`);
                            const loggedIn = clientReady(status);
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
