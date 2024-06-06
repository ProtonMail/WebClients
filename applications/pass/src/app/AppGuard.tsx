import { type FC, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Route } from 'react-router-dom';

import { useClient, useClientRef } from 'proton-pass-web/app/Context/ClientProvider';

import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { LockProbeProvider } from '@proton/pass/components/Core/LockProbeProvider';
import { PasswordUnlockProvider } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PinUnlockProvider } from '@proton/pass/components/Lock/PinUnlockProvider';
import { authStore } from '@proton/pass/lib/auth/store';
import { clientOffline } from '@proton/pass/lib/client';
import { offlineResume } from '@proton/pass/store/actions';
import noop from '@proton/utils/noop';

import { useAuthService } from './Context/AuthServiceProvider';
import { Lobby } from './Views/Lobby';
import { Main } from './Views/Main';

export const AppGuard: FC = () => {
    const dispatch = useDispatch();
    const { state } = useClient();
    const client = useClientRef();
    const online = useConnectivity();
    const auth = useAuthService();

    const handleProbe = useCallback(() => auth.checkLock().catch(noop), []);

    useEffect(() => {
        const localID = authStore.getLocalID();
        const status = client.current.state.status;
        if (online && clientOffline(status)) dispatch(offlineResume.intent({ localID }));
    }, [online]);

    return (
        <Route
            path="*"
            render={() =>
                state.booted ? (
                    <LockProbeProvider onProbe={handleProbe}>
                        <PasswordUnlockProvider>
                            <PinUnlockProvider>
                                <Main />
                            </PinUnlockProvider>
                        </PasswordUnlockProvider>
                    </LockProbeProvider>
                ) : (
                    <Lobby />
                )
            }
        />
    );
};
