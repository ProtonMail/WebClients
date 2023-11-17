import { type FC, createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { OTPProvider } from '@proton/pass/components/Otp/OTPProvider';
import { clientReady } from '@proton/pass/lib/client';
import { generateTOTPCode } from '@proton/pass/lib/otp/generate';
import { AppStatus, type Maybe, type OtpRequest } from '@proton/pass/types';
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

/** wraps the client context in a ref when you need to access
 * it outside of the react life-cycle.  */
export const useClientRef = () => {
    const client = useClient();
    const clientRef = useRef(client);
    clientRef.current = client;
    return clientRef;
};

export const ClientProvider: FC = ({ children }) => {
    const [state, setState] = useState<ClientState>(getInitialClientState);
    const generateOTP = useCallback(({ totpUri }: OtpRequest) => generateTOTPCode(totpUri), []);

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
            <OTPProvider generate={generateOTP}>{children}</OTPProvider>
        </ClientContext.Provider>
    );
};
