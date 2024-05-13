import { type FC } from 'react';
import { useDispatch } from 'react-redux';
import { Route } from 'react-router-dom';

import { useClient, useClientRef } from 'proton-pass-web/app/Context/ClientProvider';

import { ConnectivityProvider } from '@proton/pass/components/Core/ConnectivityProvider';
import { api } from '@proton/pass/lib/api/api';
import { authStore } from '@proton/pass/lib/auth/store';
import { clientOffline, clientPasswordLocked, clientReady, clientSessionLocked } from '@proton/pass/lib/client';
import { offlineResume, startEventPolling, stopEventPolling } from '@proton/pass/store/actions';
import { ping } from '@proton/shared/lib/api/tests';

import { useAuthService } from './Context/AuthServiceProvider';
import { Lobby } from './Views/Lobby';
import { Main } from './Views/Main';

export const AppGuard: FC = () => {
    const { state } = useClient();
    const clientRef = useClientRef();
    const dispatch = useDispatch();
    const auth = useAuthService();

    const onPing = async () => api(ping());

    const onConnectivityChange = (online: boolean) => {
        const localID = authStore.getLocalID();
        const status = clientRef.current.state.status;

        if (online) {
            /** Restart event polling if the client had already booted up */
            if (clientReady(status)) dispatch(startEventPolling());

            /** If the client was offline locked, force re-authentication. This
             * ensures navigating away from the password unlock view if the user
             * has a session lock registered when going online. */
            if (clientPasswordLocked(status)) void auth.init({ forceLock: true });

            /** If the client was previously offline unlocked and network connectivity
             * resumes, attempt to silently resume the session in the background. */
            if (clientOffline(status)) dispatch(offlineResume(localID));
        } else {
            dispatch(stopEventPolling());

            /** If the client is session locked and goes offline, re-authenticate
             * to potentially trigger offline password unlock if enabled. */
            if (clientSessionLocked(status)) void auth.init({ forceLock: true });
        }
    };

    return (
        <ConnectivityProvider subscribe={api.subscribe} onPing={onPing} onChange={onConnectivityChange}>
            <Route path="*" render={() => (state.booted ? <Main /> : <Lobby />)} />
        </ConnectivityProvider>
    );
};
