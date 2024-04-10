import { type FC } from 'react';
import { useDispatch } from 'react-redux';
import { Route } from 'react-router-dom';

import { useClient, useClientRef } from 'proton-pass-web/app/Context/ClientProvider';

import { ConnectivityProvider } from '@proton/pass/components/Core/ConnectivityProvider';
import { api } from '@proton/pass/lib/api/api';
import { authStore } from '@proton/pass/lib/auth/store';
import { clientOffline, clientReady } from '@proton/pass/lib/client';
import { offlineResume, startEventPolling, stopEventPolling } from '@proton/pass/store/actions';
import { ping } from '@proton/shared/lib/api/tests';

import { Lobby } from './Views/Lobby';
import { Main } from './Views/Main';

export const AppGuard: FC = () => {
    const { state } = useClient();
    const clientRef = useClientRef();
    const dispatch = useDispatch();

    const onPing = async () => api(ping());

    const onConnectivityChange = (online: boolean) => {
        const localID = authStore.getLocalID();
        const status = clientRef.current.state.status;

        if (online) {
            if (clientReady(status)) dispatch(startEventPolling());
            /** if the client was offline unlocked and network connectivity
             * resumes, try to silently resume the session in the background */
            if (clientOffline(status)) dispatch(offlineResume(localID));
        } else dispatch(stopEventPolling());
    };

    return (
        <ConnectivityProvider subscribe={api.subscribe} onPing={onPing} onChange={onConnectivityChange}>
            <Route path="*" render={() => (state.booted ? <Main /> : <Lobby />)} />
        </ConnectivityProvider>
    );
};
